import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let instance = null;

function createEcho() {
    return new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
        },
    });
}

function getEcho() {
    if (!instance) instance = createEcho();
    return instance;
}

export function reconnectEcho() {
    if (instance) { instance.disconnect(); instance = null; }
    instance = createEcho();
    return instance;
}

const echo = new Proxy({}, {
    get(_, prop) {
        const val = getEcho()[prop];
        return typeof val === 'function' ? val.bind(getEcho()) : val;
    },
});

// api.js da X-Socket-ID uchun
window.Echo = echo;

export default echo;
