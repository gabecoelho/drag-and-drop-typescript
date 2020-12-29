// Project Type
class Project {
	constructor(public id: string, public title: string, public description: string, public people: number, public status: Status) {}
}

enum Status {
	Active,
	Finished
}

type Listener = (items: Project[]) => void;

// Project State Management
class ProjectState {

	private projects: Project[] = [];
	private listeners: Listener[] = [];
	private static instance: ProjectState;

	private constructor() {}


	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addListener(listenerFn: Listener) {
		this.listeners.push(listenerFn);
	}

	addProject(title: string, description: string, numPeople: number) {
		const newProject = new Project((Math.random() + Date.now()).toString(), title, description, numPeople, Status.Active)

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

//Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;

	constructor(templateId: string, hostElementId: string, insertAtBeginning: boolean, newElementId?: string) {
		this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;

		const importedNode = document.importNode(this.templateElement.content, true);

		// Add css id
		this.element = importedNode.firstElementChild as U;

		if (newElementId) {
			this.element.id = newElementId;
		}

		this.attach(insertAtBeginning);
	}

	private attach(insertAtBeginning: boolean) {
		this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
	}

	abstract configure(): void;
	abstract renderContent(): void;
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

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

class ProjectList extends Component<HTMLDivElement, HTMLElement> {

	assignedProjects: Project[];
	
	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects`)
		
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}


	configure() {
		// Register listener here
		projectState.addListener((projects: Project[]) => {
			const displayedProjects = projects.filter(project => {
				if (this.type === 'active') {
					return project.status === Status.Active;
				}
				return project.status === Status.Finished;
			});
			this.assignedProjects = displayedProjects;
			this.renderProjects();
		});
	}

	renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;	
	}

	private renderProjects() {
		const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
		
		// This will re-render all projects. Not ideal, but a solution to the duplication of projects
		listElement.innerHTML = '';
		for (const projectItem of this.assignedProjects) {
			const listItem = document.createElement('li');
			listItem.textContent = projectItem.title;
			listElement?.appendChild(listItem);
		}
	}
}

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');