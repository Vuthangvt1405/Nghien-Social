import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from "axios";
import Cookies from "js-cookie";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class ApiService {
  protected readonly instance: AxiosInstance;

  public constructor() {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use(
      (config) => {
        const authToken = Cookies.get("authToken");
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Handle errors globally
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  public get<T = unknown>(
    url: string,
    params?: object
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params });
  }

  public post<T = unknown>(
    url: string,
    data?: object,
    config?: object
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  public patch<T = unknown>(
    url: string,
    data?: object,
    config?: object
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  public delete<T = unknown>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }
}

export default new ApiService();
