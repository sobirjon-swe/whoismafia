import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

function TelegramButton({ onSuccess, onError }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!BOT_USERNAME || !containerRef.current) return;

        window.onTelegramAuth = async (tgUser) => {
            try {
                const res = await api.post('/auth/telegram', tgUser);
                onSuccess(res.data.token, res.data.user);
            } catch (err) {
                onError(err.response?.data?.message || 'Telegram orqali kirishda xatolik');
            }
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', BOT_USERNAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-radius', '2');
        script.async = true;

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(script);

        return () => { delete window.onTelegramAuth; };
    }, []);

    if (!BOT_USERNAME) {
        return (
            <div style={warningBoxStyle}>
                ⚠ VITE_TELEGRAM_BOT_USERNAME sozlanmagan
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{ display: 'flex', justifyContent: 'center', minHeight: '48px', alignItems: 'center' }}
        />
    );
}

export default function Login() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const { login } = useAuth();

    const [view, setView] = useState('telegram');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTelegramSuccess = (token, userData) => {
        login(token, userData);
        navigate('/dashboard');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate(res.data.user?.is_admin ? '/admin' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Email yoki parol noto\'g\'ri');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <button className="theme-toggle" onClick={toggle} style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100 }}>
                {theme === 'dark' ? '☀ LIGHT' : '🌙 DARK'}
            </button>

            <div className="card card-red-top fade-in" style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <p className="font-cinzel" style={{ fontSize: '10px', letterSpacing: '0.58em', color: 'var(--color-text-4)', marginBottom: '6px' }}>
                        WHO IS
                    </p>
                    <h1 className="font-cinzel" style={{ fontSize: '30px', fontWeight: 900, color: 'var(--color-text-1)' }}>
                        MAFIA
                    </h1>
                </div>

                <div style={dividerStyle} />

                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', padding: '4px' }}>
                    {[
                        { key: 'telegram', label: 'Telegram' },
                        { key: 'email',    label: 'Email'    },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setView(tab.key); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: 'Space Grotesk, sans-serif',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                transition: 'all 0.15s',
                                background: view === tab.key ? 'var(--color-surface-alt)' : 'transparent',
                                color: view === tab.key ? 'var(--color-text-1)' : 'var(--color-text-4)',
                                borderBottom: view === tab.key ? '2px solid var(--color-red)' : '2px solid transparent',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {view === 'telegram' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <TelegramButton onSuccess={handleTelegramSuccess} onError={setError} />
                        {error && <p style={errorStyle}>{error}</p>}
                    </div>
                )}

                {view === 'email' && (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                            style={inputStyle}
                        />
                        <input
                            type="password"
                            placeholder="Parol"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        {error && <p style={errorStyle}>{error}</p>}
                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>
                            {loading ? 'KIRISH...' : 'KIRISH →'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-4)' }}>
                        Hisobingiz yo'qmi?{' '}
                        <Link to="/register" style={{ color: 'var(--color-red-bright)', textDecoration: 'none' }}>
                            Ro'yxatdan o'ting
                        </Link>
                    </span>
                    <button onClick={() => navigate('/')} style={backBtnStyle}>
                        ← Bosh sahifaga
                    </button>
                </div>
            </div>
        </div>
    );
}

const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: `radial-gradient(ellipse 100% 55% at 50% 108%, rgba(110,0,0,0.16) 0%, transparent 55%),
                 radial-gradient(ellipse 70% 38% at 50% -4%, rgba(40,0,0,0.55) 0%, transparent 55%)`,
};

const cardStyle = {
    maxWidth: '408px',
    width: '100%',
    padding: '48px 44px',
    backdropFilter: 'blur(20px)',
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    color: 'var(--color-text-1)',
    fontSize: '14px',
    fontFamily: 'Space Grotesk, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
};

const errorStyle = {
    fontSize: '12px',
    color: 'var(--color-red-bright)',
    textAlign: 'center',
};

const dividerStyle = {
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(139,0,0,0.42), transparent)',
    marginBottom: '24px',
};

const backBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-4)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'Space Grotesk, sans-serif',
};

const warningBoxStyle = {
    padding: '12px 16px',
    background: 'rgba(255,100,0,0.08)',
    border: '1px solid rgba(255,100,0,0.25)',
    borderRadius: '2px',
    fontSize: '12px',
    color: '#FF8A65',
    textAlign: 'center',
};
