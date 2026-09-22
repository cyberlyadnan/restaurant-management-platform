import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionUser } from '@nodedr-restaurant/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { STORAGE_KEYS } from '../config/env';

interface Branch {
  id: string;
  name: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  branchId: string | null;
  branches: Branch[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectBranch: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on app launch
  useEffect(() => {
    async function initSession() {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedBranch = await AsyncStorage.getItem(STORAGE_KEYS.BRANCH_ID);

        if (storedToken) {
          const res = await api.get<{ user: SessionUser }>('/auth/me');
          setUser(res.user);

          // Fetch branches for this restaurant
          const branchList = await api.get<Branch[]>('/branches');
          setBranches(branchList);

          if (storedBranch && branchList.some((b) => b.id === storedBranch)) {
            setBranchId(storedBranch);
          } else if (branchList.length > 0) {
            setBranchId(branchList[0].id);
          }
        }
      } catch (err) {
        console.log('Session restore error or expired:', err);
        await api.clearToken();
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: SessionUser }>('/auth/login', {
      email,
      password,
    });

    await api.setToken(res.token);
    setUser(res.user);

    // Fetch branches
    const branchList = await api.get<Branch[]>('/branches');
    setBranches(branchList);
    if (branchList.length > 0) {
      setBranchId(branchList[0].id);
      await AsyncStorage.setItem(STORAGE_KEYS.BRANCH_ID, branchList[0].id);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    await api.clearToken();
    setUser(null);
    setBranchId(null);
  };

  const selectBranch = async (id: string) => {
    setBranchId(id);
    await AsyncStorage.setItem(STORAGE_KEYS.BRANCH_ID, id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        branchId,
        branches,
        isLoading,
        login,
        logout,
        selectBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
