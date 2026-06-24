import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Laravel broadcast()->toOthers() uchun — yuboruvchini WebSocket eventdan chiqaradi
    try {
        const socketId = window.Echo?.socketId?.();
        if (socketId) config.headers['X-Socket-ID'] = socketId;
    } catch {}

    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
