// Project State Management
class ProjectState {

	private projects: any[] = [];
	private listeners: any[] = [];
	private static instance: ProjectState;

	private constructor() {}


	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addListener(listenerFn: Function) {
		this.listeners.push(listenerFn);
	}

	addProject(title: string, description: string, numPeople: number) {
		const newProject = {
			id: (Math.random() + Date.now()).toString(),
			title,
			description,
			people: numPeople
		};

		this.projects.push(newProject);

		// Pass array of projects to each listener function
		for (const listenerFn of this.listeners) {
			listenerFn(this.projects.slice());
		}
	}
}

const projectState = ProjectState.getInstance();

// Validator logic
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validateInput(validatorInput: Validatable) {
	let isValid = true;

	if (validatorInput.required) {
		isValid = isValid && validatorInput.value.toString().trim().length !== 0;
	}
	if (validatorInput.minLength != null && typeof validatorInput.value == 'string') {
		isValid = isValid && validatorInput.value.length > validatorInput.minLength;
	}
	// Not only check for truthyness but include value of 0 in minLength
	if (validatorInput.maxLength != null && typeof validatorInput.value == 'string') {
		isValid = isValid && validatorInput.value.length < validatorInput.maxLength;
	}
	// Not only check for truthyness but include value of 0 in maxLength
	if (validatorInput.min != null && typeof validatorInput.value === 'number') {
		isValid = isValid && validatorInput.value > validatorInput.min;
	}
	// Not only check for truthyness but include value of 0 in maxLength
	if (validatorInput.max != null && typeof validatorInput.value === 'number') {
		isValid = isValid && validatorInput.value < validatorInput.max;
	}

	return isValid;
}

// Autobind decorator
const autobind = (_: any, _2: string, descriptor: PropertyDescriptor) => {

	const originalMethod = descriptor.value;
	const adjustedDescriptor: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFunction = originalMethod.bind(this);
			return boundFunction;
		}
	}

	return adjustedDescriptor;
}

class ProjectInput {

	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLFormElement;
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		// Notice both approaches to type casting
		this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;

		// Form inside templateElement
		const importedNode = document.importNode(this.templateElement.content, true);

		// Add css id
		this.element = importedNode.firstElementChild as HTMLFormElement;
		this.element.id = 'user-input';

		this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

		this.configure();
		this.attach();
	}

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

	private configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	private attach() {
		this.hostElement.insertAdjacentElement('afterbegin', this.element)
	}

}

class ProjectList {

	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLElement;
	assignedProjects: any[];
	
	constructor(private type: 'active' | 'finished') {
		this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
		this.hostElement = document.getElementById('app')! as HTMLDivElement;
		this.assignedProjects = [];

		const importedNode = document.importNode(this.templateElement.content, true);

		// Add css id
		this.element = importedNode.firstElementChild as HTMLElement;
		this.element.id = `${this.type}-projects`;

		// Register listener here
		projectState.addListener((projects: any) => {
			this.assignedProjects = projects;
			this.renderProjects();
		});

		this.attach();
		this.renderContent();
	}

	private renderProjects() {
		const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
		for (const projectItem of this.assignedProjects) {
			const listItem = document.createElement('li');
			listItem.textContent = projectItem.title;
			listElement?.appendChild(listItem);
		}
	}

	private renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;
		
		
	}

	private attach() {
		this.hostElement.insertAdjacentElement('beforeend', this.element)
	}
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');