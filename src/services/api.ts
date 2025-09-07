import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});


api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response) {
            console.error("API Error:", {
                url: error.config?.url,
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error.request) {
            console.error("Network Error: No response from server", error.request);
        } else {
            console.error("Unexpected Error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
