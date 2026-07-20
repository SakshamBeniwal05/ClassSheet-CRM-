export default class ApiError extends Error {
    statuscode: number
    error: unknown[]

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
