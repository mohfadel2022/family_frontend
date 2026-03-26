"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE, getAuthHeader } from '@/lib/api';
import { THEMES, PageTheme, getThemeByPath, PALETTES } from '@/lib/themes';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface ThemeConfig {
  path: string;
  colorName: string;
}

interface PageThemeContextType {
  themes: ThemeConfig[];
  refreshThemes: () => Promise<void>;
  isLoading: boolean;
  getDynamicTheme: (path: string) => PageTheme;
  setLocalOverride: (path: string, colorName: string | null) => void;
}

const PageThemeContext = createContext<PageThemeContextType | undefined>(undefined);

export const PageThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);


  const refreshThemes = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/meta/themes`, getAuthHeader());
      setThemes(response.data);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshThemes();
  }, [refreshThemes]);

  const setLocalOverride = useCallback((path: string, colorName: string | null) => {
    setLocalOverrides(prev => {
      if (colorName === null) {
        const next = { ...prev };
        delete next[path];
        return next;
      }
      return { ...prev, [path]: colorName };
    });
  }, []);

    const getDynamicTheme = useCallback((path: string): PageTheme => {
    // 1. Check local override (for live preview)
    const localColor = Object.entries(localOverrides)
      .filter(([p]) => p === '/' ? (path === '/' || path.startsWith('/dashboard')) : path.startsWith(p))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1];
    if (localColor) {
      const key = localColor.toUpperCase();
      if (PALETTES[key]) return PALETTES[key];
    }

    // 2. Check for exact match or specific prefix in DB themes
    const sortedThemes = [...themes].sort((a, b) => b.path.length - a.path.length);
    const config = sortedThemes.find(t => t.path === '/' ? (path === '/' || path.startsWith('/dashboard')) : path.startsWith(t.path));
    if (config) {
      const themeKey = config.colorName.toUpperCase();
      if (PALETTES[themeKey]) return PALETTES[themeKey];
      if (THEMES[themeKey]) return THEMES[themeKey];
    }

    // 3. Fallback to hardcoded logic
    return getThemeByPath(path);
  }, [themes, localOverrides]);

  return (
    <PageThemeContext.Provider value={{ themes, refreshThemes, isLoading, getDynamicTheme, setLocalOverride }}>
      {children}
    </PageThemeContext.Provider>
  );
};

export const usePageThemeContext = () => {
  const context = useContext(PageThemeContext);
  if (!context) {
    throw new Error('usePageThemeContext must be used within a PageThemeProvider');
  }
  return context;
};
