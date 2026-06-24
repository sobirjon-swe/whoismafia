import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';
import echo from '../lib/echo';

function formatTime(seconds) {
    if (seconds >= 60) { const m = Math.floor(seconds / 60), s = seconds % 60; return s > 0 ? `${m} min ${s} sek` : `${m} min`; }
    return `${seconds} sek`;
}

export default function Lobby() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggle } = useTheme();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/rooms/${code}`)
            .then(r => { setRoom(r.data); setLoading(false); })
            .catch(() => { setError('Xona topilmadi'); setLoading(false); });

        // Save to recent rooms
        const recent = JSON.parse(localStorage.getItem('recent_rooms') || '[]');
        const updated = [code, ...recent.filter(c => c !== code)].slice(0, 5);
        localStorage.setItem('recent_rooms', JSON.stringify(updated));
    }, [code]);

    useEffect(() => {
        if (!room) return;

        const channel = echo.channel(`rooms.${code}`);

        channel.listen('PlayerJoined', ({ player }) => {
            setRoom(r => ({ ...r, players: [...(r.players || []), player] }));
        });

        channel.listen('PlayerReady', ({ user_id, is_ready }) => {
            setRoom(r => ({
                ...r,
                players: r.players.map(p => p.user_id === user_id ? { ...p, is_ready } : p),
            }));
        });

        channel.listen('GameStarting', () => {
            navigate(`/game/${code}`);
        });

        return () => echo.leaveChannel(`rooms.${code}`);
    }, [room?.id]);

    const toggleReady = async () => {
        try {
            const res = await api.post(`/rooms/${code}/ready`);
            setRoom(r => ({
                ...r,
                players: r.players.map(p => p.user_id === user?.id ? { ...p, is_ready: res.data.is_ready } : p),
            }));
        } catch {}
    };

    const startGame = async () => {
        setStarting(true);
        try {
            await api.post(`/rooms/${code}/start`);
            navigate(`/game/${code}`);
        } catch (e) {
            if (e.response?.data?.already_started) {
                navigate(`/game/${code}`);
                return;
            }
            setError(e.response?.data?.message || 'Xatolik');
            setStarting(false);
        }
    };

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-3)' }}>Yuklanmoqda...</p></div>;
    if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-red-bright)' }}>{error}</p></div>;

    const isHost = room?.host_user_id === user?.id;
    const myPlayer = room?.players?.find(p => p.user_id === user?.id);
    const readyCount = room?.players?.filter(p => p.is_ready).length || 0;
    const totalPlayers = room?.players?.filter(p => !p.is_spectator).length || 0;

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ height: '60px', background: 'var(--color-surface-nav)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: '18px' }}>←</button>
                <div style={{ padding: '4px 12px', background: 'rgba(139,0,0,0.1)', border: '1px solid rgba(139,0,0,0.4)', borderRadius: '2px' }}>
                    <span className="font-cinzel" style={{ fontSize: '14px', letterSpacing: '0.15em', color: 'var(--color-red-bright)' }}>{code}</span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{readyCount}/{totalPlayers} tayyor</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀' : '🌙'}</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Player grid */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {Array.from({ length: room?.player_count || 8 }).map((_, i) => {
                            const p = room?.players?.[i];
                            const isMe = p?.user_id === user?.id;
                            return (
                                <div key={i} className="player-card" style={{ cursor: 'default', opacity: p ? 1 : 0.3 }}>
                                    <div style={{ position: 'relative' }}>
                                        <div className="avatar">{p ? p.initials || p.name?.[0]?.toUpperCase() : '?'}</div>
                                        {p && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, right: 0,
                                                width: '10px', height: '10px', borderRadius: '50%',
                                                background: p.is_ready ? '#4CAF50' : 'var(--color-text-4)',
                                                border: '2px solid var(--color-bg)',
                                            }} />
                                        )}
                                    </div>
                                    {p ? (
                                        <>
                                            <p style={{ fontSize: '12px', color: 'var(--color-text-2)', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                                            {isMe && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(139,0,0,0.09)', border: '1px solid rgba(139,0,0,0.4)', color: 'var(--color-red-bright)', borderRadius: '2px' }}>SIZ</span>}
                                            <p style={{ fontSize: '11px', color: p.is_ready ? '#4CAF50' : 'var(--color-text-4)', animation: !p.is_ready ? 'blink2 2s step-end infinite' : 'none' }}>
                                                {p.is_ready ? '● Tayyor' : '○ Kutilmoqda'}
                                            </p>
                                        </>
                                    ) : (
                                        <p style={{ fontSize: '11px', color: 'var(--color-text-5)' }}>Bo'sh joy</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card" style={{ padding: '20px' }}>
                        <p className="font-cinzel" style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--color-text-4)', marginBottom: '12px' }}>SOZLAMALAR</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>O'yinchilar</span>
                                <span className="font-cinzel" style={{ fontSize: '13px' }}>{room?.player_count}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>Suhbat</span>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{formatTime(room?.talk_time)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>Ovoz berish</span>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{formatTime(room?.vote_time)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>O'zini oqlash</span>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-2)' }}>{formatTime(room?.defense_time)}</span>
                            </div>
                        </div>
                    </div>

                    {isHost ? (
                        <button
                            className="btn-primary"
                            onClick={startGame}
                            disabled={starting || totalPlayers < 3}
                            style={{ width: '100%', padding: '16px', fontSize: '13px' }}
                        >
                            {starting ? 'BOSHLANMOQDA...' : "O'YINNI BOSHLASH →"}
                        </button>
                    ) : (
                        <button
                            onClick={toggleReady}
                            style={{
                                width: '100%', padding: '16px', cursor: 'pointer',
                                background: myPlayer?.is_ready ? 'rgba(76,175,80,0.1)' : 'transparent',
                                border: `1px solid ${myPlayer?.is_ready ? '#4CAF50' : 'rgba(255,255,255,0.15)'}`,
                                color: myPlayer?.is_ready ? '#4CAF50' : 'var(--color-text-3)',
                                borderRadius: '2px', fontSize: '13px', fontWeight: 600,
                                fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
                            }}
                        >
                            {myPlayer?.is_ready ? '✓ TAYYOR' : 'TAYYOR EMAS'}
                        </button>
                    )}

                    {!isHost && (
                        <p style={{ fontSize: '11px', color: 'var(--color-text-4)', textAlign: 'center', animation: 'blink2 2s step-end infinite' }}>
                            ● BOSHLANISHNI KUTISH
                        </p>
                    )}

                    {error && <p style={{ fontSize: '12px', color: 'var(--color-red-bright)' }}>{error}</p>}
                </div>
            </div>
        </div>
    );
}
