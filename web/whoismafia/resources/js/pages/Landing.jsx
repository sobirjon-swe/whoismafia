import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const suits = ['♠', '♦', '♣', '♥'];

const suitPositions = [
    { top: '12%', left: '8%',  fontSize: '80px', animDuration: '7s',  animDelay: '0s' },
    { top: '65%', left: '5%',  fontSize: '60px', animDuration: '9s',  animDelay: '1s' },
    { top: '20%', right: '9%', fontSize: '70px', animDuration: '8s',  animDelay: '0.5s' },
    { top: '70%', right: '7%', fontSize: '90px', animDuration: '10s', animDelay: '2s' },
    { top: '42%', left: '15%', fontSize: '50px', animDuration: '8.5s',animDelay: '1.5s' },
    { top: '38%', right: '15%',fontSize: '55px', animDuration: '7.5s',animDelay: '0.8s' },
];

export default function Landing() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();

    return (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

            {/* Atmospheric background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse 100% 55% at 50% 108%, rgba(110,0,0,0.16) 0%, transparent 55%),
                             radial-gradient(ellipse 70% 38% at 50% -4%, rgba(40,0,0,0.55) 0%, transparent 55%)`
            }} />

            {/* Floating suits */}
            {suitPositions.map((pos, i) => (
                <span key={i} style={{
                    position: 'absolute',
                    ...pos,
                    fontFamily: 'Cinzel, serif',
                    color: 'rgba(100,0,0,0.10)',
                    animation: `float ${pos.animDuration} ease-in-out ${pos.animDelay} infinite`,
                    zIndex: 1,
                    userSelect: 'none',
                }}>
                    {suits[i % 4]}
                </span>
            ))}

            {/* Theme toggle */}
            <button
                className="theme-toggle"
                onClick={toggle}
                style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 100 }}
            >
                {theme === 'dark' ? '☀ LIGHT' : '🌙 DARK'}
            </button>

            {/* Main content */}
            <div className="fade-in" style={{ position: 'relative', zIndex: 2, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '0.38em', color: 'var(--color-text-5)', textTransform: 'uppercase' }}>
                    REAL-TIME ONLINE GAME
                </p>

                <div>
                    <p className="font-cinzel" style={{ fontSize: 'clamp(13px,1.7vw,19px)', letterSpacing: '0.7em', color: 'var(--color-text-4)', marginBottom: '4px' }}>
                        WHO IS
                    </p>
                    <h1 className="font-cinzel glow-pulse" style={{
                        fontSize: 'clamp(72px,10vw,130px)',
                        fontWeight: 900,
                        color: 'var(--color-text-1)',
                        lineHeight: 1,
                        letterSpacing: '0.04em',
                    }}>
                        MAFIA
                    </h1>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--color-text-4)', fontStyle: 'italic', lineHeight: 2, maxWidth: '380px' }}>
                    Kim mafia ekanini top — agar ulgurasang.<br />
                    3 dan 50 tagacha o'yinchi.
                </p>

                <button
                    className="btn-primary"
                    onClick={() => navigate('/login')}
                    style={{ marginTop: '12px' }}
                >
                    O'YINNI BOSHLASH
                </button>
            </div>
        </div>
    );
}
