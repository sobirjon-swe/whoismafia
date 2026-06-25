import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { theme, toggle } = useTheme();

    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setError('Parollar mos kelmaydi');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', form);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors;
            if (typeof msg === 'object') {
                setError(Object.values(msg).flat()[0]);
            } else {
                setError(msg || 'Ro\'yxatdan o\'tishda xatolik');
            }
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

                <p className="font-cinzel" style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--color-text-4)', textAlign: 'center', marginBottom: '20px' }}>
                    YANGI HISOB
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        type="text"
                        placeholder="Ismingiz"
                        value={form.name}
                        onChange={set('name')}
                        required
                        autoFocus
                        style={inputStyle}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={set('email')}
                        required
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Parol (kamida 6 ta belgi)"
                        value={form.password}
                        onChange={set('password')}
                        required
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Parolni tasdiqlang"
                        value={form.password_confirmation}
                        onChange={set('password_confirmation')}
                        required
                        style={inputStyle}
                    />

                    {error && <p style={errorStyle}>{error}</p>}

                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', marginTop: '4px' }}
                    >
                        {loading ? 'YUKLANMOQDA...' : "RO'YXATDAN O'TISH →"}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-4)' }}>
                        Hisobingiz bormi?{' '}
                        <Link to="/login" style={{ color: 'var(--color-red-bright)', textDecoration: 'none' }}>
                            Kirish
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
