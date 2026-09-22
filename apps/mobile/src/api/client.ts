import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { DEFAULT_API_URL, STORAGE_KEYS } from '../config/env';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private currentBaseUrl: string = DEFAULT_API_URL || 'http://10.0.2.2:4000/api/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.currentBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      if (!this.token) {
        this.token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      }
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.clearToken();
        }
        return Promise.reject(error);
      },
    );
  }

  public async setBaseUrl(url: string) {
    this.currentBaseUrl = url;
    this.client.defaults.baseURL = url;
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
  }

  public async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  public async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const res = await this.client.get<T>(url, { params });
    return res.data;
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    const res = await this.client.post<T>(url, data);
    return res.data;
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    const res = await this.client.put<T>(url, data);
    return res.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const res = await this.client.delete<T>(url);
    return res.data;
  }
}

export const api = new ApiClient();
