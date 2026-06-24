import { useState, useEffect } from 'react';
import api from '../lib/api';
import { reconnectEcho } from '../lib/echo';

export function useAuth() {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        if (!user && localStorage.getItem('auth_token')) {
            api.get('/auth/me')
                .then(r => { setUser(r.data.user); localStorage.setItem('user', JSON.stringify(r.data.user)); })
                .catch(() => { localStorage.removeItem('auth_token'); localStorage.removeItem('user'); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        reconnectEcho();
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return { user, loading, login, logout };
}
