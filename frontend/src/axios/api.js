import Axios from "axios"
import { BACKEND_ENDPOINT } from "../configs/get_env"

export const api = Axios.create({
    baseURL: BACKEND_ENDPOINT,
});

api.interceptors.request.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
)