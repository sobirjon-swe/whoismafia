import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            if (!res.data.user?.is_admin) {
                setError('Admin huquqi yo\'q');
                return;
            }
            login(res.data.token, res.data.user);
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Email yoki parol noto\'g\'ri');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <p style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(139,0,0,0.7)', marginBottom: '20px', fontFamily: 'Cinzel, serif' }}>
                    ADMIN
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    {error && <p style={{ fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        style={btnStyle}
                    >
                        {loading ? '...' : 'KIRISH'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
};

const cardStyle = {
    padding: '40px',
    border: '1px solid rgba(139,0,0,0.2)',
    borderRadius: '2px',
    background: 'rgba(255,255,255,0.02)',
    width: '320px',
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '2px',
    color: '#ccc',
    fontSize: '13px',
    fontFamily: 'Space Grotesk, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
};

const btnStyle = {
    width: '100%',
    padding: '10px',
    background: 'rgba(139,0,0,0.2)',
    border: '1px solid rgba(139,0,0,0.4)',
    borderRadius: '2px',
    color: '#cc2222',
    fontSize: '12px',
    fontFamily: 'Cinzel, serif',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    marginTop: '4px',
};
