// Validator logic
export interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

export function validateInput(validatorInput: Validatable) {
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