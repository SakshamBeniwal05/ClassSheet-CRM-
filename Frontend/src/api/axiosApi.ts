import axios from "axios";

export const apiCaller = axios.create({
    baseURL:import.meta.env.BACKEND_URLBACKEND_URL,
    withCredentials: true
})