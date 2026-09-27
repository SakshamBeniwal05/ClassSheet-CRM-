export default class ApiError extends Error {
    statuscode: number
    error: unknown[]

    get statusCode(): number {
        return this.statuscode;
    }

    set statusCode(code: number) {
        this.statuscode = code;
    }

    constructor(
        statuscode: number,
        message = "something went wrong",
        error: unknown[] = [],
        stack?: string
    ) {
        super(message)
        this.statuscode = statuscode
        this.error = error

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
