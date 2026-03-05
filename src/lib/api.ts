
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Base paths
export const API_BASE = API_URL;
export const SUB_BASE = `${API_URL}/subscriptions`;
export const META_BASE = `${API_URL}/meta`;
export const UPLOAD_BASE = `${API_URL}/upload`;

// Common auth utility
export const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        headers: {
            Authorization: `Bearer ${token || 'mock-token'}`
        }
    };
};
