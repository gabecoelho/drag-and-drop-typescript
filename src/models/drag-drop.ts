namespace App {
	// Draggable items
	export interface Draggable {
		dragStartHandler(event: DragEvent): void;
		dragEndHandler(event: DragEvent): void;
	}

	// Where Items are dragged to and from
	export interface DragTarget {
		dragOverHandler(event: DragEvent): void; // Signal to JS that your target is valid as a drag over
		dropHandler(event: DragEvent): void; // Handle the drop and change the UI accordingly
		dragLeaveHandler(event: DragEvent): void;// Revert UI updates in case it changes
	}
}