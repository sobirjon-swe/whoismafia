import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';

const roleColors = { mafia: 'var(--color-mafia)', detective: 'var(--color-detective)', doctor: 'var(--color-doctor)', citizen: 'var(--color-citizen)' };

function formatTime(seconds) {
    if (seconds >= 60) {
        const m = Math.floor(seconds / 60), s = seconds % 60;
        return s > 0 ? `${m} min ${s} sek` : `${m} min`;
    }
    return `${seconds} sek`;
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return 'MF-' + Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();

    const [settings, setSettings] = useState({ player_count: 8, talk_time: 120, vote_time: 60, defense_time: 30, spectator_allowed: false });
    const [roomCode, setRoomCode] = useState(generateCode());
    const [joinCode, setJoinCode] = useState('');
    const [stats, setStats] = useState({ total: 0, wins: 0, win_percent: 0, mafia_count: 0, detective_count: 0 });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/stats').then(r => setStats(r.data)).catch(() => {});
        api.get('/history').then(r => setHistory(r.data.data || [])).catch(() => {});
    }, []);

    const createRoom = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.post('/rooms', settings);
            navigate(`/lobby/${res.data.code}`);
        } catch (e) {
            setError(e.response?.data?.message || 'Xatolik yuz berdi');
        } finally { setLoading(false); }
    };

    const joinRoom = async () => {
        if (!joinCode.trim()) return;
        setJoinLoading(true); setError('');
        try {
            await api.post(`/rooms/${joinCode.toUpperCase()}/join`);
            navigate(`/lobby/${joinCode.toUpperCase()}`);
        } catch (e) {
            setError(e.response?.data?.message || 'Xona topilmadi');
        } finally { setJoinLoading(false); }
    };

    const adjust = (field, delta, min, max) => {
        setSettings(s => ({ ...s, [field]: Math.max(min, Math.min(max, s[field] + delta)) }));
    };

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="nav">
                <a href="/" className="nav-logo"><span>WHO IS</span>MAFIA</a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>● Online</span>
                    {user?.is_admin && (
                        <a href="/admin" style={{ fontSize: '11px', padding: '4px 12px', background: 'rgba(139,0,0,0.12)', border: '1px solid rgba(139,0,0,0.3)', borderRadius: '10px', color: 'var(--color-red-bright)', textDecoration: 'none', letterSpacing: '0.08em', fontFamily: 'Cinzel, serif' }}>
                            ADMIN
                        </a>
                    )}
                    <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀ LIGHT' : '🌙 DARK'}</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '20px' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{user?.name}</span>
                        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--color-text-4)', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }}>✕</button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 36px' }}>
                {error && <p style={{ color: 'var(--color-red-bright)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    {/* Create Room */}
                    <div className="card card-red-top" style={{ padding: '32px' }}>
                        <h2 className="font-cinzel" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.1em' }}>XONA YARATISH</h2>

                        <div style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-sub)', borderRadius: '2px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Player count */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>O'yinchilar</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => adjust('player_count', -1, 3, 50)} style={{ width: '28px', height: '28px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: '16px' }}>−</button>
                                    <span className="font-cinzel" style={{ fontSize: '18px', minWidth: '32px', textAlign: 'center' }}>{settings.player_count}</span>
                                    <button onClick={() => adjust('player_count', 1, 3, 50)} style={{ width: '28px', height: '28px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: '16px' }}>+</button>
                                </div>
                            </div>

                            {/* Time settings */}
                            {[
                                { label: 'Suhbat vaqti', field: 'talk_time', min: 10, max: 600 },
                                { label: 'Ovoz berish', field: 'vote_time', min: 10, max: 300 },
                                { label: 'O\'zini oqlash', field: 'defense_time', min: 10, max: 180 },
                            ].map(({ label, field, min, max }) => (
                                <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={() => adjust(field, -10, min, max)} style={{ width: '24px', height: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1px', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '12px' }}>−</button>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-2)', minWidth: '80px', textAlign: 'center' }}>{formatTime(settings[field])}</span>
                                        <button onClick={() => adjust(field, 10, min, max)} style={{ width: '24px', height: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1px', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '12px' }}>+</button>
                                    </div>
                                </div>
                            ))}

                            {/* Room code */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>Xona kodi</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="font-cinzel" style={{ fontSize: '16px', letterSpacing: '0.1em', color: 'var(--color-red-bright)' }}>{roomCode}</span>
                                    <button onClick={() => setRoomCode(generateCode())} style={{ background: 'none', border: 'none', color: 'var(--color-text-4)', cursor: 'pointer', fontSize: '14px' }}>↻</button>
                                </div>
                            </div>
                        </div>

                        <button className="btn-primary" onClick={createRoom} disabled={loading} style={{ width: '100%', marginTop: '16px', padding: '14px' }}>
                            {loading ? 'YARATILMOQDA...' : 'XONA YARATISH →'}
                        </button>
                    </div>

                    {/* Join Room */}
                    <div className="card" style={{ padding: '32px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                        <h2 className="font-cinzel" style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.1em' }}>XONAGA QOSHILISH</h2>

                        <input
                            type="text"
                            placeholder="MF-XXXX"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && joinRoom()}
                            maxLength={7}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '2px',
                                color: 'var(--color-text-1)',
                                fontSize: '20px',
                                fontFamily: 'Cinzel, serif',
                                letterSpacing: '0.2em',
                                textAlign: 'center',
                                outline: 'none',
                                marginBottom: '16px',
                            }}
                        />

                        <button className="btn-primary" onClick={joinRoom} disabled={joinLoading} style={{ width: '100%', padding: '14px' }}>
                            {joinLoading ? 'QOSHILMOQDA...' : 'QOSHILISH →'}
                        </button>

                        {/* Recent rooms from localStorage */}
                        {(() => {
                            const recent = JSON.parse(localStorage.getItem('recent_rooms') || '[]');
                            return recent.length > 0 ? (
                                <div style={{ marginTop: '24px' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--color-text-4)', marginBottom: '10px', letterSpacing: '0.1em' }}>OXIRGI XONALAR</p>
                                    {recent.slice(0, 3).map(code => (
                                        <button key={code} onClick={() => setJoinCode(code)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', padding: '6px 0', fontSize: '13px', fontFamily: 'Cinzel, serif' }}>
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>

                {/* Stats */}
                <div className="card" style={{ padding: '24px 32px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', gap: '16px' }}>
                    {[
                        { label: "O'yinlar", value: stats.total, color: 'var(--color-text-1)' },
                        { label: "G'alaba", value: stats.wins, color: '#C41E3A' },
                        { label: "G'alaba %", value: `${stats.win_percent}%`, color: '#C41E3A' },
                        { label: 'Mafia roli', value: stats.mafia_count, color: 'var(--color-detective)' },
                        { label: 'Detektiv', value: stats.detective_count, color: 'var(--color-detective)' },
                    ].map(({ label, value, color }) => (
                        <div key={label}>
                            <p className="font-cinzel" style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</p>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-4)', marginTop: '4px', letterSpacing: '0.05em' }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* History */}
                {history.length > 0 && (
                    <div className="card" style={{ padding: '24px 32px' }}>
                        <h3 className="font-cinzel" style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.1em' }}>O'YIN TARIXI</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    {['Sana', 'Xona', 'Rol', 'O\'yinchilar', 'Natija'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', color: 'var(--color-text-4)', fontWeight: 500, letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 10).map(h => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border-sub)', height: '40px' }}>
                                        <td style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{new Date(h.played_at).toLocaleDateString('uz')}</td>
                                        <td className="font-cinzel" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{h.room_code}</td>
                                        <td><span style={{ fontSize: '12px', color: roleColors[h.role] || 'var(--color-text-3)' }}>{h.role}</span></td>
                                        <td style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{h.player_count}</td>
                                        <td style={{ fontSize: '12px', color: h.won ? '#4CAF50' : 'var(--color-text-4)' }}>{h.won ? '✓ Yutdim!' : '✗ Yutqazdim'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
