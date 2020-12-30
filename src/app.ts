// Drag & Drop Interfaces
interface Draggable {
	dragStartHandler(event: DragEvent): void;
	dragEndHandler(event: DragEvent): void;
}

// Where Items are dragged to and from
interface DragTarget {
	dragOverHandler(event: DragEvent): void; // Signal to JS that your target is valid as a drag over
	dropHandler(event: DragEvent): void; // Handle the drop and change the UI accordingly
	dragLeaveHandler(event: DragEvent): void;// Revert UI updates in case it changes
}

class Project {
	constructor(public id: string, public title: string, public description: string, public people: number, public status: Status) {}
}

enum Status {
	Active,
	Finished
}

type Listener<T> = (items: T[]) => void;

class State<T> {

	protected listeners: Listener<T>[] = [];

	addListener(listenerFn: Listener<T>) {
		this.listeners.push(listenerFn);
	}
}

// Project State Management
class ProjectState extends State<Project> {

	private projects: Project[] = [];

	private static instance: ProjectState;

	private constructor() {
		super();
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addProject(title: string, description: string, numPeople: number) {
		const newProject = new Project((Math.random() + Date.now()).toString(), title, description, numPeople, Status.Active)

		this.projects.push(newProject);
		this.updateListeners();
	}

	moveProject(projectId: string, newStatus: Status) {
		const project = this.projects.find(project => project.id === projectId);
		if (project && project.status !== newStatus) {
			project.status = newStatus;
			this.updateListeners();
		}
	}

	private updateListeners() {
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

class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {

	assignedProjects: Project[];
	
	constructor(private type: 'active' | 'finished') {
		super('project-list', 'app', false, `${type}-projects`)
		
		this.assignedProjects = [];

		this.configure();
		this.renderContent();
	}

	@autobind
	dragOverHandler(event: DragEvent): void {
		if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
			event.preventDefault();
			const listEl = this.element.querySelector('ul')!;
			listEl.classList.add('droppable');
		}
	}

	@autobind
	dropHandler(event: DragEvent): void {
		const projectId = event.dataTransfer!.getData('text/plain');
		projectState.moveProject(projectId, this.type === 'active' ? Status.Active : Status.Finished);
	}

	@autobind
	dragLeaveHandler(_: DragEvent): void {
		const listEl = this.element.querySelector('ul')!;
		listEl.classList.remove('droppable');
	}

	configure() {
		// Register listeners here
		this.element.addEventListener('dragover', this.dragOverHandler);
		this.element.addEventListener('dragleave', this.dragLeaveHandler);
		this.element.addEventListener('drop', this.dropHandler);

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
			new ProjectItem(this.element.querySelector('ul')!.id, projectItem);
		}
	}
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {

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

const projectInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');