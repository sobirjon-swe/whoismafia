import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';
import echo from '../lib/echo';

const roleEmoji  = { mafia: '🔪', detective: '🔍', doctor: '💊', citizen: '👤' };
const roleLabel  = { mafia: 'Mafia', detective: 'Detektiv', doctor: 'Shifokor', citizen: 'Fuqaro' };

function Timer({ endsAt, onExpire }) {
    const [seconds, setSeconds] = useState(0);
    const firedRef = useRef(false);

    useEffect(() => {
        firedRef.current = false;
        if (!endsAt) return;
        const update = () => {
            const diff = Math.max(0, Math.floor((new Date(endsAt * 1000) - Date.now()) / 1000));
            setSeconds(diff);
            if (diff === 0 && !firedRef.current) {
                firedRef.current = true;
                onExpire?.();
            }
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [endsAt]);

    const m = Math.floor(seconds / 60), s = seconds % 60;
    return (
        <span className="font-cinzel" style={{
            fontSize: '22px', fontWeight: 700,
            color: seconds <= 10 ? '#EF5350' : 'var(--color-text-1)',
            animation: seconds <= 10 ? 'blink2 1s step-end infinite' : 'none',
        }}>
            {m}:{s.toString().padStart(2, '0')}
        </span>
    );
}

function NightPanel({ phase, myRole, players, roomCode, onSubmit }) {
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        setSelected(null);
        setSubmitted(false);
        setResult(null);
    }, [phase]);

    if (phase !== 'night') return null;

    const actionLabel = { mafia: 'O\'ldirish', doctor: 'Himoya qilish', detective: 'Tekshirish' };
    const actionColor = { mafia: '#EF5350', doctor: '#81C784', detective: '#64B5F6' };

    if (!['mafia', 'doctor', 'detective'].includes(myRole)) {
        return (
            <div style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>😴</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-4)', lineHeight: 1.8 }}>
                    Tun vaqti.<br />Fuqaro uyquda...
                </p>
            </div>
        );
    }

    const handleSubmit = async () => {
        if (!selected) return;
        const actionType = { mafia: 'kill', doctor: 'protect', detective: 'check' }[myRole];
        try {
            const res = await api.post(`/game/${roomCode}/night-action`, {
                action_type: actionType,
                target_id: selected,
            });
            setSubmitted(true);
            if (myRole === 'detective') setResult(res.data.is_mafia);
            onSubmit?.();
        } catch {}
    };

    const selPlayer = players.find(p => p.user_id === selected);

    if (submitted) {
        return (
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>✓</p>
                <p style={{ fontSize: '13px', color: actionColor[myRole], fontWeight: 600, marginBottom: '6px' }}>
                    {actionLabel[myRole]} amalga oshirildi
                </p>
                {myRole === 'detective' && selPlayer && result !== null && (
                    <div style={{
                        marginTop: '12px', padding: '12px 16px',
                        background: result ? 'rgba(196,30,58,0.1)' : 'rgba(76,175,80,0.1)',
                        border: `1px solid ${result ? 'rgba(196,30,58,0.3)' : 'rgba(76,175,80,0.3)'}`,
                        borderRadius: '2px',
                    }}>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginBottom: '4px' }}>{selPlayer.name}</p>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: result ? '#EF5350' : '#81C784' }}>
                            {result ? '🔪 MAFIA!' : '✓ Tinch fuqaro'}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <p style={{ fontSize: '10px', color: actionColor[myRole], letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center' }}>
                {roleEmoji[myRole]} {actionLabel[myRole]}
            </p>
            {selPlayer ? (
                <div style={{ textAlign: 'center' }}>
                    <div className="avatar" style={{ margin: '0 auto 8px' }}>{selPlayer.initials || selPlayer.name?.[0]}</div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-1)', marginBottom: '12px' }}>{selPlayer.name}</p>
                    <button onClick={handleSubmit} style={{
                        width: '100%', padding: '12px',
                        background: actionColor[myRole], color: '#fff',
                        border: 'none', borderRadius: '2px',
                        fontWeight: 700, fontSize: '11px', letterSpacing: '0.15em',
                        cursor: 'pointer', fontFamily: 'Cinzel, serif',
                    }}>
                        ✓ {actionLabel[myRole].toUpperCase()}
                    </button>
                    <button onClick={() => setSelected(null)} style={{ marginTop: '6px', background: 'none', border: 'none', color: 'var(--color-text-4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                        Bekor qilish
                    </button>
                </div>
            ) : (
                <p style={{ fontSize: '12px', color: 'var(--color-text-4)', textAlign: 'center', lineHeight: 1.8 }}>
                    Yuqoridagi o'yinchini tanlang
                </p>
            )}
        </div>
    );
}

function ChatPanel({ phase, myRole, messages, user, messageInput, setMessageInput, sendMessage, chatRef, defenderName }) {
    if (phase === 'voting') {
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid var(--color-border)',
                padding: '24px',
                background: 'rgba(180,0,0,0.04)',
            }}>
                <p style={{ fontSize: '36px', marginBottom: '16px' }}>🗳</p>
                <p className="font-cinzel" style={{
                    fontSize: '15px', fontWeight: 700,
                    color: 'var(--color-red-bright)',
                    letterSpacing: '0.1em', textAlign: 'center', marginBottom: '10px',
                }}>
                    OVOZ BERISH BOSHLANDI!
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-4)', textAlign: 'center', lineHeight: 1.8 }}>
                    Shubhali o'yinchini tanlang.<br />
                    Tezroq ovoz bering!
                </p>
                <div style={{
                    marginTop: '20px', padding: '8px 18px',
                    border: '1px solid rgba(180,0,0,0.3)', borderRadius: '2px',
                    fontSize: '10px', color: 'var(--color-text-5)', letterSpacing: '0.1em',
                }}>
                    CHAT YOPIQ
                </div>
            </div>
        );
    }

    if (phase === 'night' && myRole !== 'mafia') {
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid var(--color-border)',
            }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>🌙</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-4)', lineHeight: 1.8, textAlign: 'center' }}>
                    Tun vaqti. Chat yopiq.
                </p>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
            {phase === 'defense' && defenderName && (
                <div style={{
                    padding: '8px 14px',
                    background: 'rgba(100,181,246,0.08)',
                    borderBottom: '1px solid rgba(100,181,246,0.2)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span style={{ fontSize: '13px' }}>🛡</span>
                    <span style={{ fontSize: '11px', color: '#64B5F6', letterSpacing: '0.06em' }}>
                        <strong>{defenderName}</strong> o'zini himoya qilmoqda
                    </span>
                </div>
            )}

            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map(m => {
                    const isMe = m.user_id === user?.id;
                    return (
                        <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                            {!isMe && (
                                <div className="avatar" style={{ width: '26px', height: '26px', fontSize: '9px', flexShrink: 0 }}>
                                    {m.initials || m.name?.[0]}
                                </div>
                            )}
                            <div style={{
                                maxWidth: '75%', padding: '8px 12px', borderRadius: '2px',
                                background: isMe ? 'rgba(90,0,0,0.2)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isMe ? 'rgba(139,0,0,0.4)' : 'var(--color-border)'}`,
                                fontSize: '13px', color: 'var(--color-text-2)',
                            }}>
                                {!isMe && <p style={{ fontSize: '10px', color: 'var(--color-text-4)', marginBottom: '4px' }}>{m.name}</p>}
                                {m.message}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ padding: '10px', display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)' }}>
                <input
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={phase === 'defense' ? 'Himoya qiling...' : 'Xabar yozing...'}
                    style={{
                        flex: 1, padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '2px', color: 'var(--color-text-1)',
                        fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
                    }}
                />
                <button onClick={sendMessage} style={{
                    padding: '8px 16px', background: 'var(--color-red)', color: '#fff',
                    border: 'none', borderRadius: '2px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 700, fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
                }}>
                    JO'NAT
                </button>
            </div>
        </div>
    );
}

export default function Game() {
    const { code }          = useParams();
    const navigate          = useNavigate();
    const { user }          = useAuth();
    const { theme, toggle } = useTheme();
    const chatRef           = useRef(null);

    const [gameState, setGameState]                         = useState(null);
    const [accusedUserId, setAccusedUserId]                 = useState(null);
    const [messages, setMessages]                           = useState([]);
    const [messageInput, setMessageInput]                   = useState('');
    const [selectedPlayer, setSelectedPlayer]               = useState(null);
    const [voteSubmitted, setVoteSubmitted]                 = useState(false);
    const [nightActionSubmitted, setNightActionSubmitted]   = useState(false);
    const [tieNotification, setTieNotification]             = useState(false);
    const [loading, setLoading]                             = useState(true);

    const fetchState = useCallback(() => {
        api.get(`/game/${code}/state`)
            .then(r => {
                setGameState(r.data);
                if (r.data.night_action_submitted) setNightActionSubmitted(true);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [code]);

    useEffect(() => {
        fetchState();
        api.get(`/game/${code}/messages`).then(r => setMessages(r.data.messages || [])).catch(() => {});
    }, [code]);

    // state() dan kelgan accused_user_id ni saqlash
    useEffect(() => {
        if (gameState?.accused_user_id !== undefined) {
            setAccusedUserId(gameState.accused_user_id);
        }
    }, [gameState?.accused_user_id]);

    // Timer tugaganda barcha o'yinchilar advance-phase chaqiradi; backend idempotent
    const onPhaseExpire = useCallback(async () => {
        if (!gameState) return;
        try {
            await api.post(`/game/${code}/advance-phase`, { from_phase: gameState.room.current_phase });
        } catch {}
    }, [code, gameState?.room?.current_phase]);

    useEffect(() => {
        if (!gameState) return;

        const channel = echo.channel(`game.${code}`);

        channel.listen('PhaseChanged', ({ phase, day_count, phase_ends_at, accused_user_id, is_tie }) => {
            setGameState(s => ({ ...s, room: { ...s.room, current_phase: phase, day_count, phase_ends_at } }));
            setAccusedUserId(accused_user_id ?? null);
            setSelectedPlayer(null);
            setVoteSubmitted(false);
            setNightActionSubmitted(false);
            if (phase === 'defense' && is_tie) {
                setTieNotification(true);
                setTimeout(() => setTieNotification(false), 5000);
            }
        });

        channel.listen('PlayerVoted', ({ voter_id, target_id }) => {
            setGameState(s => ({
                ...s,
                players: s.players.map(p => ({
                    ...p,
                    votes: p.user_id === target_id ? (p.votes || 0) + 1 : p.votes,
                })),
            }));
        });

        channel.listen('PlayerEliminated', ({ user_id, role }) => {
            setGameState(s => ({
                ...s,
                players: s.players.map(p => p.user_id === user_id ? { ...p, is_alive: false, role } : p),
            }));
        });

        channel.listen('GameEnded', () => {
            navigate(`/results/${code}`);
        });

        channel.listen('MessageSent', ({ message }) => {
            setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
        });

        return () => echo.leaveChannel(`game.${code}`);
    }, [gameState?.room?.code]);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const sendMessage = async () => {
        if (!messageInput.trim()) return;
        const text = messageInput;
        setMessageInput('');
        try {
            const res = await api.post(`/game/${code}/messages`, { message: text });
            setMessages(prev => prev.some(m => m.id === res.data.id) ? prev : [...prev, res.data]);
        } catch {}
    };

    const submitVote = async () => {
        if (!selectedPlayer || voteSubmitted) return;
        try {
            await api.post(`/game/${code}/vote`, { target_id: selectedPlayer });
            setVoteSubmitted(true);
        } catch {}
    };

    if (loading || !gameState) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-3)' }}>Yuklanmoqda...</p></div>;
    }

    const { room, players, my_role } = gameState;
    const phase = room.current_phase;
    const isDay = phase === 'day' || phase === 'voting' || phase === 'defense';
    const mafiaTeam = gameState.mafia_team ?? [];

    // Defense vaqtida ayblanuvchi (backend qaror qilgan)
    const defenderPlayer = (phase === 'defense' && accusedUserId)
        ? players.find(p => p.user_id === accusedUserId) ?? null
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {tieNotification && (
                <div style={{
                    position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(139,0,0,0.92)', color: '#fff', padding: '10px 24px',
                    borderRadius: '2px', fontSize: '13px', fontFamily: 'Cinzel, serif',
                    letterSpacing: '0.1em', zIndex: 1000, border: '1px solid rgba(255,255,255,0.2)',
                }}>
                    ⚖ Tenglik! Tasodifiy tanlov amalga oshirildi
                </div>
            )}
            {/* Header */}
            <div style={{ height: '52px', background: 'var(--color-surface-nav)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '16px', flexShrink: 0 }}>
                <span className={`role-badge phase-${isDay ? 'day' : 'night'}`} style={{ padding: '4px 12px', borderRadius: '2px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em' }}>
                    {phase === 'day'     && '💬 SUHBAT'}
                    {phase === 'voting'  && '🗳 OVOZ BERISH'}
                    {phase === 'defense' && '🛡 HIMOYA'}
                    {phase === 'night'   && '☾ TUN'}
                    {' '}{room.day_count}
                </span>
                <Timer endsAt={room.phase_ends_at} onExpire={onPhaseExpire} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <a className="nav-logo" href="/"><span>WHO IS</span>MAFIA</a>
                    {my_role && (
                        <span className={`role-badge role-${my_role}`}>
                            {roleEmoji[my_role]} {roleLabel[my_role]}
                        </span>
                    )}
                    <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀' : '🌙'}</button>
                </div>
            </div>

            {/* Player grid */}
            <div style={{ flex: 1, padding: '18px 26px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {players.map(p => {
                        const isMe       = p.is_me;
                        const canVote    = phase === 'voting' && p.is_alive && !isMe && !voteSubmitted;
                        const canTarget  = phase === 'night' && p.is_alive && !isMe && !nightActionSubmitted &&
                            ['mafia', 'doctor', 'detective'].includes(my_role) &&
                            !(my_role === 'mafia' && mafiaTeam.includes(p.user_id));
                        const isSelected = selectedPlayer === p.user_id;
                        const isDefender = defenderPlayer?.user_id === p.user_id;

                        return (
                            <div
                                key={p.id}
                                className={`player-card ${!p.is_alive ? 'dead' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => (canVote || canTarget) && setSelectedPlayer(p.user_id)}
                                style={{
                                    cursor: (canVote || canTarget) ? 'pointer' : 'default',
                                    outline: isDefender ? '2px solid rgba(100,181,246,0.6)' : undefined,
                                }}
                            >
                                <div className="avatar" style={{ background: isMe ? 'rgba(139,0,0,0.25)' : undefined }}>
                                    {p.initials || p.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--color-text-2)', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.name}
                                </p>
                                {isMe && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(139,0,0,0.09)', border: '1px solid rgba(139,0,0,0.4)', color: 'var(--color-red-bright)', borderRadius: '2px' }}>SIZ</span>}
                                {isDefender && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(100,181,246,0.1)', border: '1px solid rgba(100,181,246,0.4)', color: '#64B5F6', borderRadius: '2px' }}>🛡</span>}
                                {p.role && (
                                    <span className={`role-badge role-${p.role}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                        {roleEmoji[p.role]} {roleLabel[p.role]}
                                    </span>
                                )}
                                {(p.votes > 0) && <span style={{ fontSize: '11px', color: 'var(--color-red-bright)' }}>▲ {p.votes}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom panel */}
            <div style={{ height: '270px', display: 'flex', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
                <ChatPanel
                    phase={phase}
                    myRole={my_role}
                    messages={messages}
                    user={user}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    sendMessage={sendMessage}
                    chatRef={chatRef}
                    defenderName={defenderPlayer?.name}
                />

                {/* Right panel */}
                <div style={{ width: '310px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    {phase === 'night' ? (
                        <NightPanel
                            phase={phase}
                            myRole={my_role}
                            players={players}
                            roomCode={code}
                            onSubmit={() => setNightActionSubmitted(true)}
                        />
                    ) : phase !== 'voting' ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-4)', lineHeight: 1.8 }}>
                                {phase === 'day'     && '💬 Suhbat davom etmoqda...'}
                                {phase === 'defense' && '🛡 Ayblanuvchi o\'zini oqlamoqda...'}
                            </p>
                        </div>
                    ) : voteSubmitted ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '28px', marginBottom: '8px' }}>✓</p>
                            <p style={{ color: '#4CAF50', fontWeight: 600, marginBottom: '12px', fontSize: '13px' }}>Ovoz Berildi</p>
                            <p style={{ fontSize: '11px', color: 'var(--color-text-4)' }}>Natija kutilamoqda...</p>
                        </div>
                    ) : selectedPlayer ? (
                        <div style={{ textAlign: 'center' }}>
                            {(() => {
                                const p = players.find(pl => pl.user_id === selectedPlayer);
                                return p ? (
                                    <>
                                        <div className="avatar" style={{ margin: '0 auto 8px' }}>{p.initials}</div>
                                        <p style={{ fontSize: '14px', color: 'var(--color-text-1)', marginBottom: '16px' }}>{p.name}</p>
                                        <button className="btn-primary" onClick={submitVote} style={{ padding: '12px 32px', fontSize: '12px' }}>
                                            ✓ OVOZ BERISH
                                        </button>
                                        <button onClick={() => setSelectedPlayer(null)} className="btn-secondary" style={{ marginTop: '8px', display: 'block', width: '100%', padding: '8px', fontSize: '11px' }}>
                                            Bekor qilish
                                        </button>
                                    </>
                                ) : null;
                            })()}
                        </div>
                    ) : (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-4)', textAlign: 'center', lineHeight: 1.8 }}>
                            🗳 Ovoz berish<br />
                            <span style={{ fontSize: '11px' }}>Yuqoridagi o'yinchini tanlang</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
