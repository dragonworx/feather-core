import { Component } from '../component';

export class Panel extends Component<HTMLDivElement> {
	static componentId = 'panel';

	protected defaults(): undefined {
		return undefined;
	}
}