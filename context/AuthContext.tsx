import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AuthService from '../services/AuthService';
import { AuthContextType, UserInfo, AuthResult } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const tokens = await AuthService.getStoredTokens();
        if (tokens?.accessToken) {
          const info = await AuthService.getUserInfo(tokens.accessToken);
          setUserInfo(info);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (): Promise<AuthResult> => {
    const result = await AuthService.login();
    if (result.success) {
      setIsAuthenticated(true);
      setUserInfo(result.userInfo || null);
    }
    return result;
  };

  const logout = async (): Promise<AuthResult> => {
    const result = await AuthService.logout();
    if (result.success) {
      setIsAuthenticated(false);
      setUserInfo(null);
    }
    return result;
  };

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    userInfo,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};