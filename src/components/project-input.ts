import { autobind } from '../decorators/autobind.js';
import { projectState } from '../state/project-state.js';
import { Validatable, validateInput } from '../util/validation.js';
import { Component } from './base-component.js';

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
	
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		super('project-input', 'app', true, 'user-input');
		this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

		this.configure();
	}

	configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	renderContent() {}

	private getUserInput(): [string, string, number] | void {
		const title = this.titleInputElement.value;
		const description = this.descriptionInputElement.value;
		const people = parseInt(this.peopleInputElement.value);

		const titleValidator: Validatable = {
			value: title,
			required: true,
			minLength: 1
		};

		const descriptionValidator: Validatable = {
			value: description,
			required: true,
			minLength: 5
		};

		const peopleValidator: Validatable = {
			value: people,
			required: true,
			min: 0
		};

		if (
			!validateInput(titleValidator) ||
			!validateInput(descriptionValidator) ||
			!validateInput(peopleValidator)
		) {
			alert('Invalid input. Please retry!')
			return;
		}
		else {
			return [title, description, people];
		}

	}

	private clearInputs() {
		this.titleInputElement.value = '';
		this.descriptionInputElement.value = '';
		this.peopleInputElement.value = '';
	}

	@autobind
	private submitHandler(event: Event) {
		event.preventDefault();
		const userInput = this.getUserInput();

		if (Array.isArray(userInput)) {
			const [title, description, people] = userInput;
			projectState.addProject(title, description, people);
			this.clearInputs();
		}
	}
}