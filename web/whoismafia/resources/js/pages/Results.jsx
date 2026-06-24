import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';

const roleEmoji = { mafia: '🔪', detective: '🔍', doctor: '💊', citizen: '👤' };
const roleColor = { mafia: '#EF5350', detective: '#64B5F6', doctor: '#81C784', citizen: '#888888' };

export default function Results() {
    const { code } = useParams();
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const [data, setData] = useState(null);
    const [winner, setWinner] = useState('mafia');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/game/${code}/results`)
            .then(r => {
                setData(r.data);
                setWinner(r.data.winner ?? (r.data.players.filter(p => p.role === 'mafia' && p.is_alive).length > 0 ? 'mafia' : 'citizen'));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [code]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-3)' }}>Yuklanmoqda...</p></div>;
    }

    const players = data?.players || [];
    const mafia = players.filter(p => p.role === 'mafia');
    const town = players.filter(p => p.role !== 'mafia');

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px 80px', background: `radial-gradient(ellipse 100% 55% at 50% 108%, rgba(110,0,0,0.16) 0%, transparent 55%)` }}>
            <button className="theme-toggle" onClick={toggle} style={{ position: 'fixed', top: '24px', right: '24px' }}>
                {theme === 'dark' ? '☀ LIGHT' : '🌙 DARK'}
            </button>

            {/* Winner title */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }} className="fade-in">
                <h1 className="font-cinzel" style={{
                    fontSize: 'clamp(40px,7.5vw,96px)',
                    fontWeight: 900,
                    color: winner === 'mafia' ? '#C41E3A' : '#4CAF50',
                    animation: 'resultBoom 0.7s ease forwards',
                    lineHeight: 1,
                }}>
                    {winner === 'mafia' ? 'MAFIA' : 'FUQAROLAR'}
                </h1>
                <p className="font-cinzel" style={{ fontSize: 'clamp(22px,3.5vw,44px)', color: winner === 'mafia' ? '#8B0000' : '#388E3C', fontWeight: 600 }}>
                    YUTDI
                </p>

                {/* Stats chips */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                    {[
                        { label: "O'yinchilar", value: players.length },
                        { label: "Kun", value: data?.room?.day_count || '?' },
                        { label: 'Mafia', value: mafia.length },
                        { label: 'Fuqarolar', value: town.length },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '20px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{label}: </span>
                            <span className="font-cinzel" style={{ fontSize: '13px', color: 'var(--color-text-1)' }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Players grid */}
            <div style={{ width: '100%', maxWidth: '900px', marginBottom: '40px' }}>
                {/* Mafia section */}
                <h3 className="font-cinzel" style={{ fontSize: '13px', letterSpacing: '0.15em', color: 'var(--color-text-4)', marginBottom: '16px' }}>MAFIA</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    {mafia.map((p, i) => (
                        <div key={p.id} className="card card-red-top fade-in" style={{ padding: '20px', textAlign: 'center', animationDelay: `${i * 0.1}s` }}>
                            <div className="avatar" style={{ margin: '0 auto 10px', background: 'rgba(139,0,0,0.25)', borderColor: 'rgba(196,30,58,0.5)' }}>{p.initials || p.name?.[0]}</div>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-1)', marginBottom: '6px' }}>{p.name}</p>
                            <span className="role-badge role-mafia" style={{ fontSize: '10px' }}>🔪 Mafia</span>
                            <p style={{ fontSize: '11px', color: winner === 'mafia' ? '#4CAF50' : 'var(--color-text-4)', marginTop: '8px', fontWeight: 600 }}>
                                {winner === 'mafia' ? '✓ YUTDI' : '✗ YUTQAZDI'}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Town section */}
                <h3 className="font-cinzel" style={{ fontSize: '13px', letterSpacing: '0.15em', color: 'var(--color-text-4)', marginBottom: '16px' }}>FUQAROLAR</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {town.map((p, i) => (
                        <div key={p.id} className="card fade-in" style={{ padding: '20px', textAlign: 'center', opacity: p.is_alive ? 1 : 0.6, animationDelay: `${(mafia.length + i) * 0.1}s` }}>
                            <div className="avatar" style={{ margin: '0 auto 10px' }}>{p.initials || p.name?.[0]}</div>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-1)', marginBottom: '6px' }}>{p.name}</p>
                            <span className={`role-badge role-${p.role}`} style={{ fontSize: '10px' }}>{roleEmoji[p.role]} {p.role}</span>
                            <p style={{ fontSize: '11px', color: winner === 'citizen' ? '#4CAF50' : 'var(--color-text-4)', marginTop: '8px', fontWeight: 600 }}>
                                {winner === 'citizen' ? '✓ YUTDI' : '✗ YUTQAZDI'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                    QAYTA O'YNASH →
                </button>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                    DASHBOARD
                </button>
            </div>
        </div>
    );
}
