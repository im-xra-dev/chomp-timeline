export class NeoConnectionError extends Error {
    constructor() {
        super(`Connection to the neo4j instance could not be established`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, NeoConnectionError.prototype);
    }
    errorName: string = 'NeoConnectionError';
}
