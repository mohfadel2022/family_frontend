import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Base paths
export const API_BASE = API_URL;
export const SUB_BASE = `${API_URL}/subscriptions`;
export const META_BASE = `${API_URL}/meta`;
export const UPLOAD_BASE = `${API_URL}/upload`;
export const COST_CENTER_BASE = `${API_URL}/cost-centers`;

// Common auth utility
export const getAuthHeader = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        headers: {
            Authorization: `Bearer ${token || 'mock-token'}`
        }
    };
};

// ─── Global 403 Interceptor ────────────────────────────────────────────────────
// Runs once when this module is first imported. Any Axios request anywhere in the
// app that returns 403 will silently redirect to /unauthorized instead of
// throwing an unhandled error in the UI.
if (typeof window !== 'undefined') {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.response?.status === 403) {
                // Avoid redirect loops if we're already on the page
                if (!window.location.pathname.includes('/unauthorized')) {
                    window.location.href = '/unauthorized';
                }
                // Return a never-resolving promise so the calling code
                // never reaches its own error handler
                return new Promise(() => {});
            }
            return Promise.reject(error);
        }
    );
}
