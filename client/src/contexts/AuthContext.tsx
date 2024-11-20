import { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
        email,
        password
      });
      
      if (response.status === 200) {
        setIsAuthenticated(true);
        setUserId(response.data.userId);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Incorrect password' };
        }
        if (error.response?.status === 404) {
          return { success: false, error: 'User not found. Please register first.' };
        }
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/users/register`, {
        username: email.split('@')[0],
        email,
        password
      });
      
      if (registerResponse.status === 201) {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/users/login`, {
          email,
          password
        });
        
        if (loginResponse.status === 200) {
          setIsAuthenticated(true);
          setUserId(loginResponse.data.userId);
          return { success: true };
        }
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          return { success: false, error: 'User already exists' };
        }
      }
      return { success: false, error: 'Registration failed' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    localStorage.removeItem('todos');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}