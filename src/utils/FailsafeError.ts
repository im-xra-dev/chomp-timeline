export class FailsafeError extends Error {
    dataAttached: { [key: string]: unknown };

    constructor(dataToLog: { [key: string]: unknown }) {
        super(
            `FAILSAFE TRIGGERED`,
        );

        this.dataAttached = dataToLog;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, FailsafeError.prototype);
    }
}
