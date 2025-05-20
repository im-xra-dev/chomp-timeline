type FeedQueryErrorData = {userId:string, query:string};

export class FeedQueryError extends Error {
    constructor(error:Error, data: FeedQueryErrorData) {
        super(`FeedQueryError: could not execute the query`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, FeedQueryError.prototype);

        this.error = error;
        this.data = data;
    }
    errorName: string = 'FeedQueryError';
    error: Error;
    data: FeedQueryErrorData;
}
