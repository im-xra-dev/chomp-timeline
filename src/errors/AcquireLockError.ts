export class AcquireLockError extends Error {
    constructor(path: string, depth: number) {
        super(`AcquireLockError: could not aquire lock on ${path}. DEPTH: ${depth}`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AcquireLockError.prototype);

        this.path = path;
        this.depth = depth;
    }
    errorName: string = 'AcquireLockError';
    path: string;
    depth: number;
}
