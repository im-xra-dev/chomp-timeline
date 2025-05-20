export class InvalidDataError extends Error {
    constructor(attr: string, val: unknown) {
        super(
            `The following attribute was passed to the function in an illegal state ${attr}, ${val}`,
        );

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, InvalidDataError.prototype);
    }
}
