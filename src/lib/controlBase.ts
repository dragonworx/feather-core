import type { Descriptor, WithDescriptor, WithFullTagname, WithInitialProps } from './builder';
import { createStyle } from './stylesheet';

let _id = 0;

/** Base Control extends HTMLElement as Custom Element */
export abstract class ControlBase<
    PropsType extends object = object,
> extends HTMLElement
{
    protected _id = String(_id++);
    protected _isMounted = false;
    protected _cssClass?: string;
    protected _props: PropsType = {} as PropsType;
    protected _initialProps?: Partial<PropsType>;
    protected _shadowDom?: ShadowRoot;

    constructor()
    {
        super();
    }

    protected get descriptor(): Descriptor<PropsType>
    {
        return (this.constructor as unknown as WithDescriptor).__descriptor as Descriptor<PropsType>;
    }

    protected get fullTagName()
    {
        return (this.constructor as unknown as WithFullTagname).fullTagName;
    }

    protected get isMounted()
    {
        return this._isMounted
    }

    protected get shadowDom()
    {
        if (!this._shadowDom)
        {
            this._shadowDom = this.attachShadow({ mode: 'open' });
        }
        return this._shadowDom;
    }

    protected connectedCallback()
    {
        const { descriptor } = this;

        if (descriptor.classes)
        {
            this.classList.add(...descriptor.classes);
        }

        this._isMounted = true;

        this._props = {
            ...descriptor.props,
            ...(this as unknown as WithInitialProps)._initialProps,
            ...this._props,
        };

        this.render();
        this.mount();
    }

    protected disconnectedCallback()
    {
        this._isMounted = false;
        this.unmount();
    }

    protected adoptedCallback()
    {
        this.onDocumentChange();
    }

    public render()
    {
        const innerHTML = this.renderHtml();

        if (innerHTML)
        {
            this.innerHTML = innerHTML;
        }

        const cssText = this.renderCss();

        if (cssText)
        {
            this._cssClass = createStyle(cssText, this, this._id, this._cssClass);
        }
    }

    protected renderHtml(): string | void
    {
        return;
    }

    protected renderCss(): string | void
    {
        return
    }

    protected mount() { /** override */ }
    protected unmount() { /** override */ }

    protected onDocumentChange() { /** override */ }
}