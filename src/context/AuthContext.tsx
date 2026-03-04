"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export type UserRole = 'ADMIN' | 'RESPONSIBLE' | 'ENCARGADO' | string;

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
    isResponsible: boolean;
    isEncargado: boolean;
    hasPermission: (roles: UserRole[]) => boolean;
    checkPermission: (code: string) => boolean;
    refreshUser: () => Promise<void>;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:4000/api/meta';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async (tokenOverride?: string) => {
        const token = tokenOverride || localStorage.getItem('token') || 'mock-token';
        try {
            const res = await axios.get(`${API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error: any) {
            console.error('Error fetching user:', error);
            setUser(null);
            if (error.response?.status === 401 && !tokenOverride && localStorage.getItem('token')) {
                // If it was a real token that failed, clear it
                localStorage.removeItem('token');
                document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        await fetchUser(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'ADMIN';
    const isResponsible = user?.role === 'RESPONSIBLE';
    const isEncargado = user?.role === 'ENCARGADO';

    const hasPermission = (roles: UserRole[]) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    const checkPermission = (code: string) => {
        if (isAdmin) return true; // Power user
        return user?.permissions?.includes(code) || false;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAdmin,
            isResponsible,
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
