export default class ApiResponse<T = unknown> {
    statuscode: number
    data: T
    message: string

    constructor(statuscode: number, data: T, message = "successful api") {
        this.statuscode = statuscode
        this.data = data
        this.message = message
    }
}
