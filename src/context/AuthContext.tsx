import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccount, DeviceInfo } from '../types/auth';
import { getOrCreateDeviceInfo } from '../utils/deviceFingerprint';

interface AuthContextType {
  user: UserAccount | null;
  token: string | null;
  deviceInfo: DeviceInfo;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; isDeviceMismatch?: boolean; registeredDevice?: any }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mht_auth_token'));
  const [deviceInfo] = useState<DeviceInfo>(() => getOrCreateDeviceInfo());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate existing token on boot
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token invalid or expired
          localStorage.removeItem('mht_auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          device: deviceInfo,
        }),
      });

      const responseText = await res.text();
      let data: {
        error?: string;
        isDeviceMismatch?: boolean;
        registeredDevice?: any;
        user?: UserAccount;
        token?: string;
      } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Server login mengembalikan respons bukan JSON (HTTP ${res.status}). ` +
          'Pastikan API berjalan pada port yang benar.'
        );
      }

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Login gagal.',
          isDeviceMismatch: data.isDeviceMismatch || false,
          registeredDevice: data.registeredDevice,
        };
      }

      if (!data.user || !data.token) {
        throw new Error('Respons login tidak lengkap dari server.');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('mht_auth_token', data.token);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Koneksi ke server terputus.',
      };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // ignore error on logout
      }
    }
    localStorage.removeItem('mht_auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        deviceInfo,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
