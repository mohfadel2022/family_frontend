"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export type UserRole = 'ADMIN' | 'RESPONSABLE' | 'ENCARGADO' | string;

interface User {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    isRESPONSABLE: boolean;
    isEncargado: boolean;
    hasPermission: (roles: UserRole[]) => boolean;
    checkPermission: (code: string | string[]) => boolean;
    refreshUser: () => Promise<void>;
    login: (token: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { META_BASE } from '@/lib/api';

const API_BASE = META_BASE;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async (tokenOverride?: string) => {
        let token = tokenOverride;
        if (!token) {
            token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token') || 'mock-token') : 'mock-token';
        }
        try {
            const res = await axios.get(`${META_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error: any) {
            setUser(null);
            if (error.response?.status === 401) {
                // Expected unauthenticated state, no need to show an error overlay
                if (!tokenOverride) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('token');
                        sessionStorage.removeItem('token');
                    }
                    document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                }
            } else {
                console.error('Error fetching user:', error.message || error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (token: string, rememberMe = true) => {
        if (rememberMe) {
            localStorage.setItem('token', token);
            sessionStorage.removeItem('token');
            document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        } else {
            sessionStorage.setItem('token', token);
            localStorage.removeItem('token');
            document.cookie = `auth-token=${token}; path=/; SameSite=Strict`; // Session cookie
        }
        await fetchUser(token);
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        }
        document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'ADMIN';
    const isRESPONSABLE = user?.role === 'RESPONSABLE';
    const isEncargado = user?.role === 'ENCARGADO';

    const hasPermission = (roles: UserRole[]) => {
        if (!user) return false;
        if (isAdmin) return true; // Power user has all roles
        return roles.includes(user.role);
    };

    const checkPermission = (code: string | string[]) => {
        if (isAdmin) return true; // Power user has all permissions
        if (!user) return false;
        if (Array.isArray(code)) {
            return code.some(c => user?.permissions?.includes(c));
        }
        return user?.permissions?.includes(code) || false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAdmin,
            isRESPONSABLE,
            isEncargado,
            hasPermission,
            checkPermission,
            refreshUser: () => fetchUser(),
            login,
            logout
        }}>
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
