import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AuthService, SubscriptionService, UserService } from '../services/api';

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
  ideasPerMonth: number | -1;
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

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
  refreshSubscriptionStatus: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  checkFeatureAccess: (feature: keyof SubscriptionFeatures) => boolean;
  getRemainingIdeas: () => number | 'unlimited';
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    subscriptionStatus: null,

    // Initialize authentication state from localStorage
    initializeAuth: () => {
      const user = AuthService.getCurrentUser();
      const isAuthenticated = AuthService.isAuthenticated();
      
      set({ 
        user, 
        isAuthenticated,
        error: null 
      });

      // If authenticated, fetch subscription status
      if (isAuthenticated && user) {
        get().refreshSubscriptionStatus();
      }
    },

    // Login action
    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const authResponse = await AuthService.login({ email, password });
        
        set({
          user: authResponse.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Fetch subscription status after login
        await get().refreshSubscriptionStatus();
        
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Login failed',
        });
        throw error;
      }
    },

    // Register action
    register: async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
      set({ isLoading: true, error: null });
      
      try {
        const authResponse = await AuthService.register(userData);
        
        set({
          user: authResponse.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Fetch subscription status after registration
        await get().refreshSubscriptionStatus();
        
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || error.message || 'Registration failed',
        });
        throw error;
      }
    },

    // Logout action
    logout: () => {
      AuthService.logout();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        subscriptionStatus: null,
      });
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Refresh subscription status
    refreshSubscriptionStatus: async () => {
      try {
        const subscriptionStatus = await SubscriptionService.getStatus();
        set({ subscriptionStatus });
      } catch (error: any) {
        console.error('Failed to fetch subscription status:', error);
        // Don't set error for subscription status failures
        // as it's not critical for app functionality
      }
    },

    // Update user profile
    updateUser: async (updates: Partial<User>) => {
      const { user } = get();
      if (!user) return;

      try {
        const updatedUser = await UserService.updateProfile(updates);
        set({ 
          user: updatedUser,
          error: null 
        });
      } catch (error: any) {
        set({
          error: error.response?.data?.message || error.message || 'Profile update failed',
        });
        throw error;
      }
    },

    // Check if user has access to a feature
    checkFeatureAccess: (feature: keyof SubscriptionFeatures) => {
      const { subscriptionStatus } = get();
      if (!subscriptionStatus) return false;
      
      return subscriptionStatus.features[feature] === true;
    },

    // Get remaining ideas count
    getRemainingIdeas: () => {
      const { subscriptionStatus } = get();
      if (!subscriptionStatus) return 0;
      
      return subscriptionStatus.usage.remainingIdeas;
    },
  }))
);

// Subscription for localStorage sync
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }
);

// Export types for use in components
export type { User, SubscriptionStatus, SubscriptionFeatures };
