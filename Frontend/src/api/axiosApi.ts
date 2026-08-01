import axios from "axios";

export const apiCaller = axios.create({
    baseURL: import.meta.env.BACKEND_URL || "http://localhost:8000/api",
    withCredentials: true
})