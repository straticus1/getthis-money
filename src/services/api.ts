import axios, { AxiosResponse, AxiosError } from 'axios';
import { UserPreferences, BusinessIdea } from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('authToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: 'free' | 'premium' | 'enterprise';
  subscriptionExpires?: string;
  ideasGenerated: number;
  ideasSaved: number;
  avatar?: string;
  preferredState?: string;
  preferredIndustry?: string;
}

interface SubscriptionStatus {
  currentPlan: 'free' | 'premium' | 'enterprise';
  features: SubscriptionFeatures;
  usage: {
    ideasGenerated: number;
    remainingIdeas: number | 'unlimited';
    resetDate: string;
  };
  subscriptionExpires?: string;
}

interface SubscriptionFeatures {
  ideasPerMonth: number | -1; // -1 for unlimited
  aiGeneration: boolean;
  basicTemplates: boolean;
  ideaComparison: boolean;
  businessCanvas: boolean;
  businessPlan: boolean;
  prioritySupport: boolean;
  exportPDF: boolean;
  teamCollaboration: boolean;
  whiteLabel: boolean;
}

interface BusinessIdeaGeneration {
  preferences: UserPreferences;
  count?: number;
}

// Authentication Service
export class AuthService {
  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await apiClient.post(
      '/auth/register',
      userData
    );
    
    if (response.data.success) {
      this.setAuthData(response.data.data);
    }
    
    return response.data.data;
  }

  static async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await apiClient.post(
      '/auth/login',
      credentials
    );
    
    if (response.data.success) {
      this.setAuthData(response.data.data);
    }
    
    return response.data.data;
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  static async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: AxiosResponse<ApiResponse<{ accessToken: string }>> = await apiClient.post(
      '/auth/refresh-token',
      { refreshToken }
    );

    const newAccessToken = response.data.data.accessToken;
    localStorage.setItem('authToken', newAccessToken);
    return newAccessToken;
  }

  private static setAuthData(authData: AuthResponse): void {
    localStorage.setItem('authToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  private static clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  static getCurrentUser(): User | null {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

// Business Ideas Service
export class BusinessIdeasService {
  static async generateIdea(preferences: UserPreferences): Promise<BusinessIdea> {
    const response: AxiosResponse<ApiResponse<BusinessIdea>> = await apiClient.post(
      '/business-ideas/generate',
      { preferences }
    );
    
    return response.data.data;
  }

  static async generateMultipleIdeas(
    preferences: UserPreferences,
    count: number = 3
  ): Promise<BusinessIdea[]> {
    const response: AxiosResponse<ApiResponse<BusinessIdea[]>> = await apiClient.post(
      '/business-ideas/generate-multiple',
      { preferences, count }
    );
    
    return response.data.data;
  }

  static async getUserIdeas(): Promise<BusinessIdea[]> {
    const response: AxiosResponse<ApiResponse<BusinessIdea[]>> = await apiClient.get(
      '/business-ideas'
    );
    
    return response.data.data;
  }

  static async getSavedIdeas(): Promise<BusinessIdea[]> {
    const response: AxiosResponse<ApiResponse<BusinessIdea[]>> = await apiClient.get(
      '/business-ideas/saved'
    );
    
    return response.data.data;
  }

  static async saveIdea(ideaId: string): Promise<void> {
    await apiClient.post(`/business-ideas/${ideaId}/save`);
  }

  static async deleteIdea(ideaId: string): Promise<void> {
    await apiClient.delete(`/business-ideas/${ideaId}`);
  }

  static async updateIdea(ideaId: string, updates: Partial<BusinessIdea>): Promise<BusinessIdea> {
    const response: AxiosResponse<ApiResponse<BusinessIdea>> = await apiClient.put(
      `/business-ideas/${ideaId}`,
      updates
    );
    
    return response.data.data;
  }

  static async rateIdea(ideaId: string, rating: number, feedback?: string): Promise<void> {
    await apiClient.post(`/business-ideas/${ideaId}/rate`, {
      rating,
      feedback,
    });
  }

  static async shareIdea(ideaId: string, email: string, permission: 'view' | 'edit' = 'view'): Promise<void> {
    await apiClient.post(`/business-ideas/${ideaId}/share`, {
      email,
      permission,
    });
  }

  static async exportIdea(ideaId: string, format: 'pdf' | 'docx' | 'json' = 'pdf'): Promise<Blob> {
    const response = await apiClient.get(`/business-ideas/${ideaId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    
    return response.data;
  }

  static async generateBusinessCanvas(ideaId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post(
      `/business-ideas/business-canvas/${ideaId}`
    );
    
    return response.data.data;
  }

  static async generateBusinessPlan(ideaId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post(
      `/business-ideas/business-plan/${ideaId}`
    );
    
    return response.data.data;
  }

  static async compareIdeas(ideaIds: string[]): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post(
      '/business-ideas/compare',
      { ideaIds }
    );
    
    return response.data.data;
  }
}

// Subscription Service
export class SubscriptionService {
  static async getStatus(): Promise<SubscriptionStatus> {
    const response: AxiosResponse<ApiResponse<SubscriptionStatus>> = await apiClient.get(
      '/subscription/status'
    );
    
    return response.data.data;
  }

  static async getPlans(): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await apiClient.get(
      '/subscription/plans'
    );
    
    return response.data.data;
  }

  static async getFeatures(): Promise<SubscriptionFeatures> {
    const response: AxiosResponse<ApiResponse<SubscriptionFeatures>> = await apiClient.get(
      '/subscription/features'
    );
    
    return response.data.data;
  }

  static async createPaymentIntent(planId: string): Promise<{ clientSecret: string }> {
    const response: AxiosResponse<ApiResponse<{ clientSecret: string }>> = await apiClient.post(
      '/subscription/payment-intent',
      { planId }
    );
    
    return response.data.data;
  }

  static async subscribe(planId: string, paymentMethodId: string): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.post(
      '/subscription/subscribe',
      { planId, paymentMethodId }
    );
    
    return response.data.data;
  }

  static async cancelSubscription(): Promise<void> {
    await apiClient.post('/subscription/cancel');
  }

  static async reactivateSubscription(): Promise<void> {
    await apiClient.post('/subscription/reactivate');
  }

  static async getUpgradeOptions(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.get(
      '/subscription/upgrade-options'
    );
    
    return response.data.data;
  }
}

// User Service
export class UserService {
  static async getProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.get('/users/profile');
    
    return response.data.data;
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.put(
      '/users/profile',
      updates
    );
    
    // Update local storage
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data.data;
  }

  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    await apiClient.put('/users/preferences', preferences);
  }

  static async getAnalytics(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.get('/users/analytics');
    
    return response.data.data;
  }

  static async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/profile');
    AuthService.logout();
  }
}

// Health Service
export class HealthService {
  static async checkHealth(): Promise<{ status: string; message: string; timestamp: string }> {
    const response: AxiosResponse<ApiResponse<any>> = await apiClient.get('/health');
    
    return response.data.data;
  }
}

// Error Handling Utility
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Generic API Error Handler
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const responseData = error.response.data as any;
    const message = responseData?.message || responseData?.error || error.message;
    const data = error.response.data;
    
    return new ApiError(message, status, data);
  } else if (error.request) {
    // Request was made but no response received
    return new ApiError('Network error - please check your connection', 0);
  } else {
    // Something else happened
    return new ApiError(error.message || 'An unexpected error occurred');
  }
};

// Export all services as a single object for easier importing
export const API = {
  auth: AuthService,
  businessIdeas: BusinessIdeasService,
  subscription: SubscriptionService,
  user: UserService,
  health: HealthService,
  handleError: handleApiError,
};

export default API;
