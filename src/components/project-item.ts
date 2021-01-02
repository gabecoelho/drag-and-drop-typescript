import { Draggable } from '../models/drag-drop';
import { Component } from '../components/base-component';
import { Project } from '../models/project';
import { autobind } from '../decorators/autobind';

export class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {

	private project: Project;

	get people() {
		if (this.project.people === 1) {
			return '1 person';
		}
		else {
			return `${this.project.people} people`;
		}
	}
	
	constructor(hostId: string, project: Project) {
		super('single-project', hostId, false, project.id);
		this.project = project;

		this.configure();
		this.renderContent();
	}

	@autobind
	dragStartHandler(event: DragEvent): void {
		event.dataTransfer?.setData('text/plain', this.project.id);
		event.dataTransfer!.effectAllowed = 'move';
	}

	dragEndHandler(_: DragEvent): void {
		
	}

	configure() {
		// Listen for a drag event
		this.element.addEventListener('dragstart', this.dragStartHandler);
		this.element.addEventListener('dragend', this.dragEndHandler);
	}

	renderContent() {
		this.element.querySelector('h2')!.textContent = this.project.title;
		this.element.querySelector('h3')!.textContent = `${this.people} assigned`;
		this.element.querySelector('p')!.textContent = this.project.description;
	}

}