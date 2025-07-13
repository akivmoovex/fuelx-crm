import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../utils/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string;
  businessUnitId?: string;
  permissions: string[];
  tenant?: Tenant;
}

interface Tenant {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<{
        token: string;
        user: User & { tenant: Tenant };
        permissions: string[];
      }>('/api/auth/login', { email, password });

      localStorage.setItem('token', data.token);
      setUser(data.user);
      setTenant(data.user.tenant);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTenant(null);
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      apiClient.get<{ user: User & { tenant: Tenant }; tenant: Tenant }>('/api/auth/me')
        .then(data => {
          setUser(data.user);
          setTenant(data.tenant);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, login, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
 