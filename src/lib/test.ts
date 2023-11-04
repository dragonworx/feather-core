import { Ctrl } from './builder';
import { Control } from './control';
import type { DiffSet } from './diff';

/** Example Control */
export type TestProps = {
    x: number;
    y: boolean;
    z: string;
};

export type TestEvents = {
    event1: { foo: string };
    event2: { bar: number };
    event3: null;
}

/** Create an instantiable Control */
export default Ctrl({
    tagName: 'test',
    props: {
        x: 0,
        y: true,
        z: "foo"
    },
    classes: ['test'],
}, class Test extends Control<TestProps, TestEvents>
{
    protected mount(): void
    {
        console.log("test mount")
        this.addEventListener('click', () => console.log(this.props));
    }

    protected unmount(): void
    {
        console.log("test unmount!");
    }

    /** do a test */
    public test() { }

    protected renderInnerHTML(): string | void
    {
        return `
            <div>x: ${this.props.x}</div>
            <div>y: ${this.props.y}</div>
            <div>z: ${this.props.z}</div>
        `;
    }

    protected onPropsChanged(diff: DiffSet): void
    {
        super.onPropsChanged(diff);

        this.render();
    }
});
