import type { Control } from './control';
import { toHyphenCase } from './util';

export const tagPref = 'ctrl-';

export type Constructor<T> = new (...args: unknown[]) => T;

export type WithFullTagname = { fullTagName: string };
export type WithInitialProps = { _initialProps: object };
export type WithAttributes = { observedAttributes: string[] };

export type AttributeType = "string" | "number" | "boolean";
export type AttributeValidator = (value: string) => boolean;
export interface AttributeDescriptor
{
    type?: AttributeType;
    validate?: AttributeValidator;
    public?: boolean;
}

export const attributeValidators: Record<AttributeType, AttributeValidator> = {
    string: () => true,
    number: (value) => !isNaN(Number(value)),
    boolean: (value) => { const val = String(value).toLowerCase(); return val === "true" || val === "false" },
};

export interface Descriptor<PropsType extends object = object>
{
    tagName?: string;
    props: PropsType;
    classes?: string[];
    template?: HTMLElement | string;
    attributes?: Partial<Record<keyof PropsType, AttributeDescriptor | string>>;
    shouldRenderOnPropChange?: boolean;
}

export const descriptorDefaults: Partial<Descriptor> = {
    shouldRenderOnPropChange: true,
};

export type WithDescriptor = { descriptor: Descriptor };
export type Writable<T, K extends keyof T> = Omit<T, K> & { -readonly [P in K]: T[P] };

/** Custom Element registration function */
export function Ctrl<PropsType extends object, CtorType extends Constructor<Control<PropsType>>>(
    descriptor: Descriptor<PropsType>,
    htmlElementCtor: CtorType,
)
{
    descriptor = {
        ...descriptorDefaults,
        ...descriptor,
    };

    console.log("*** Ctrl ***", htmlElementCtor.name, descriptor);

    const { tagName, attributes: userDefinedAttributes } = descriptor;
    const fullTagName = tagPref + (tagName ?? toHyphenCase(htmlElementCtor.name));

    if (fullTagName.endsWith('-') || fullTagName.startsWith('-'))
    {
        throw new Error(`Invalid tag name: ${fullTagName}`)
    }

    /** Initialise Custom Class */
    (htmlElementCtor as unknown as WithDescriptor).descriptor = descriptor;
    (htmlElementCtor as unknown as WithFullTagname).fullTagName = fullTagName;

    /** Initialise Default Prop Attribute Observers */
    const attributes = {} as Record<keyof PropsType, AttributeDescriptor | string>;

    // add default prop attributes
    for (const [k, v] of Object.entries(descriptor.props))
    {
        const propName = k as keyof PropsType;
        const propValue = v as PropsType[keyof PropsType];

        attributes[propName] = {
            type: typeof propValue as AttributeType,
            validate: attributeValidators[typeof propValue as AttributeType],
            public: true,
        };
    }

    // add user-defined descriptor attributes
    if (userDefinedAttributes)
    {
        for (const [k, v] of Object.entries(userDefinedAttributes))
        {
            const propName = k as keyof PropsType;
            const attr = (typeof v === 'string' ? {
                type: v,
            } : v) as AttributeDescriptor;
            attr.type = attr.type ?? typeof descriptor.props[propName] as AttributeType;
            attr.validate = attr.validate ?? attributeValidators[attr.type];
            attr.public = typeof attr.public === 'boolean' ? attr.public : true;

            attributes[propName] = attr;
        }
    }

    /** Define the getters and setters type based on props */
    for (const [k, v] of Object.entries(attributes))
    {
        const propName = k as keyof PropsType;
        const attr = v as AttributeDescriptor;
        const attrName = toHyphenCase(k);
        const attrType = attr.type;
        const attrValidate = attr.validate;

        Object.defineProperty(htmlElementCtor.prototype, propName, {
            get()
            {
                const attrValue = this.getAttribute(attrName) as string | null;

                if (attrValue === null)
                {
                    return descriptor.props[propName] as unknown as PropsType[keyof PropsType];
                }

                if (attrValidate && !attrValidate(attrValue))
                {
                    throw new Error(`Invalid attribute value for ${k}: ${attrValue}`);
                }

                switch (attrType)
                {
                    case "string":
                        return attrValue;
                    case "number":
                        return Number(attrValue);
                    case "boolean":
                        return attrValue === "true";
                }
            },
            set(value)
            {
                if (attrValidate && !attrValidate(value))
                {
                    throw new Error(`Invalid attribute value for ${k}: ${value}`);
                }

                switch (attrType)
                {
                    case "string":
                        this.setAttribute(attrName, value as string);
                        break;
                    case "number":
                        this.setAttribute(attrName, String(value));
                        break;
                    case "boolean":
                        if (value)
                        {
                            this.setAttribute(attrName, "true");
                        }
                        else
                        {
                            this.removeAttribute(attrName);
                        }
                        break;
                }
            }
        });
    }

    /** Initialise Observed Attributes */
    descriptor.attributes = attributes;
    (htmlElementCtor as unknown as WithAttributes).observedAttributes = Object.keys(attributes ?? {});

    /** Define Custom Element */
    customElements.define(fullTagName, htmlElementCtor);

    /** Return Custom Class Constructor */
    return class
    {
        constructor(props: Partial<PropsType> = {})
        {
            const element = document.createElement(fullTagName) as InstanceType<CtorType>;

            (element as unknown as WithInitialProps)._initialProps = props;

            return element;
        }
    } as unknown as new (props?: Partial<PropsType>) => InstanceType<CtorType> & PropsType;
}