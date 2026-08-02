import axios from "axios";
import { userStore } from "../store/userStore";

export const apiCaller = axios.create({
    baseURL:import.meta.env.VITE_BACKEND_URL,
    withCredentials: true
})

apiCaller.interceptors.request.use(
    (config) => {
        const state: any = userStore.getState();
        const token = state?.userData?.data?.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiCaller.interceptors.response.use(
    (response) => {
        const newToken = response.headers['x-access-token'];
        if (newToken) {
            const state: any = userStore.getState();
            if (state?.userData) {
                userStore.setState({
                    userData: {
                        ...state.userData,
                        data: {
                            ...state.userData.data,
                            accessToken: newToken
                        }
                    }
                });
            }
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);