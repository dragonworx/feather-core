/* eslint-disable @typescript-eslint/no-explicit-any */

export function test()
{
    type EventHandler<T = any> = (event: T) => void;

    type MixinFunction<PropsType extends object, Api extends Record<string, any>, EventType extends string> =
        (control: any) => Mixin<PropsType, Api, EventType>;

    type Mixin<PropsType extends object = object, Api extends Record<string, any> = object, EventType extends string = string> = {
        id: string;
        defaultProps: PropsType;
        api: Api;
        events: EventType[];
    };

    type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

    type MixinsApi<M extends Array<MixinFunction<any, any, any>>> = UnionToIntersection<{
        [K in keyof M]: ReturnType<M[K]> extends Mixin<any, infer Api, any> ? Api : never;
    }[number]>;

    type MixinsEvents<M extends Array<MixinFunction<any, any, any>>> = ReturnType<M[number]>['events'][number];

    interface Descriptor<PropsType extends object, M extends Array<MixinFunction<any, any, any>>>
    {
        id: string;
        defaultProps: PropsType;
        template: string;
        mixins: M;
    }

    function createDescriptor<P extends object, M extends Array<MixinFunction<any, any, any>>>(desc: Descriptor<P, M>): Descriptor<P, M>
    {
        return desc;
    }

    function CreateControl<P extends object, M extends Array<MixinFunction<any, any, any>>>(descriptor: Descriptor<P, M>)
    {
        type MixedProps = P & UnionToIntersection<ReturnType<M[number]>['defaultProps']>;
        type MixedEvents = MixinsEvents<M>;
        type MixedApi = MixinsApi<M>;

        return class Control
        {
            private _props: MixedProps;
            private _eventHandlers: Record<string, EventHandler[]> = {};

            public descriptor = descriptor;

            constructor(props: Partial<MixedProps> = {})
            {
                this._props = {
                    ...descriptor.defaultProps,
                    ...props,
                } as MixedProps;

                descriptor.mixins.forEach((mixinFunc) =>
                {
                    const mixin = mixinFunc(this);
                    Object.assign(this._props, mixin.defaultProps);
                    Object.assign(this, mixin.api);
                });
            }

            on(event: MixedEvents, handler: EventHandler): void
            {
                if (!this._eventHandlers[event])
                {
                    this._eventHandlers[event] = [];
                }
                this._eventHandlers[event].push(handler);
            }

            emit(event: MixedEvents, data?: any): void
            {
                if (this._eventHandlers[event])
                {
                    this._eventHandlers[event].forEach((handler) => handler(data));
                }
            }
        } as unknown as (new (props: Partial<MixedProps>) => MixedApi & { on: (event: MixedEvents, handler: EventHandler) => void });
    }

    // Example Mixin1
    const mixin1: MixinFunction<{ mixin1: string }, { mixin1Method(): string }, 'mixin1Event'> = (control) =>
    {
        String(control);

        return {
            id: 'mixin1',
            defaultProps: { mixin1: 'mixin1' },
            api: {
                mixin1Method()
                {
                    return 'foo';
                },
            },
            events: ['mixin1Event'],
        };
    };

    // Example Mixin2
    const mixin2: MixinFunction<{ mixin2: string }, { mixin2Method(): string }, 'mixin2Event'> = (control) =>
    {
        String(control);
        return {
            id: 'mixin2',
            defaultProps: { mixin2: 'mixin2' },
            api: {
                mixin2Method()
                {
                    return 'bar';
                },
            },
            events: ['mixin2Event'],
        };
    };

    // Create descriptor using utility function
    const descriptor = createDescriptor({
        id: 'test',
        defaultProps: {
            foo: 'bar',
            bar: 1,
        },
        template: '<div></div>',
        mixins: [mixin1, mixin2],
    });

    const ControlClass = CreateControl(descriptor);
    const control = new ControlClass({
        foo: 'foo',
    });

    control.on('mixin1Event', () => { /* handle */ });
    control.on('mixin2Event', () => { /* handle */ });
    console.log(control.mixin1Method());  // Outputs: foo
    console.log(control.mixin2Method());  // Outputs: bar

    debugger;
}