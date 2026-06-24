import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../lib/api';

const TABS = ['Dashboard', 'Foydalanuvchilar', 'Xonalar', 'O\'yin tarixi'];

function StatCard({ label, value, color = 'var(--color-text-1)' }) {
    return (
        <div className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
            <p className="font-cinzel" style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '6px' }}>{value ?? '—'}</p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-4)', letterSpacing: '0.08em' }}>{label}</p>
        </div>
    );
}

function DashboardTab() {
    const [data, setData] = useState(null);

    useEffect(() => {
        api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {});
    }, []);

    const stats = data?.stats;
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="Jami foydalanuvchilar" value={stats?.total_users} />
                <StatCard label="Mehmon foydalanuvchilar" value={stats?.guest_users} color="var(--color-text-3)" />
                <StatCard label="Jami xonalar" value={stats?.total_rooms} />
                <StatCard label="Faol xonalar" value={stats?.active_rooms} color="#4CAF50" />
                <StatCard label="Tugallangan o'yinlar" value={stats?.finished_games} />
                <StatCard label="Jami o'yinlar" value={stats?.total_games} />
            </div>

            {data?.recent_games?.length > 0 && (
                <div className="card" style={{ padding: '24px' }}>
                    <h3 className="font-cinzel" style={{ fontSize: '13px', letterSpacing: '0.1em', marginBottom: '16px', color: 'var(--color-text-3)' }}>SO'NGGI XONALAR</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Kod', 'Holat', 'O\'yinchilar', 'Host', 'Sana'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', color: 'var(--color-text-4)', fontWeight: 500 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent_games.map(g => (
                                <tr key={g.id} style={{ borderBottom: '1px solid var(--color-border-sub)', height: '40px' }}>
                                    <td className="font-cinzel" style={{ fontSize: '13px', color: 'var(--color-text-2)' }}>{g.code}</td>
                                    <td><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: g.status === 'finished' ? 'rgba(76,175,80,0.1)' : 'rgba(139,0,0,0.1)', color: g.status === 'finished' ? '#4CAF50' : 'var(--color-red-bright)' }}>{g.status}</span></td>
                                    <td style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{g.player_count}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>{g.host?.name}</td>
                                    <td style={{ fontSize: '11px', color: 'var(--color-text-4)' }}>{new Date(g.created_at).toLocaleDateString('uz')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function UsersTab() {
    const [users, setUsers] = useState([]);
    const [pager, setPager] = useState({});
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = useCallback(() => {
        setLoading(true);
        api.get('/admin/users', { params: { search, page } })
            .then(r => { setUsers(r.data.data); setPager(r.data); })
            .catch(() => setError('Foydalanuvchilarni yuklashda xatolik'))
            .finally(() => setLoading(false));
    }, [search, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleAdmin = async (user) => {
        if (!confirm(`${user.name} admin huquqini ${user.is_admin ? 'olib tashlash' : 'berish'}?`)) return;
        try {
            await api.put(`/admin/users/${user.id}`, { is_admin: !user.is_admin });
            fetchUsers();
        } catch (e) {
            alert(e.response?.data?.message || 'Xatolik');
        }
    };

    const deleteUser = async (user) => {
        if (!confirm(`${user.name} ni o'chirish? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
        try {
            await api.delete(`/admin/users/${user.id}`);
            fetchUsers();
        } catch (e) {
            alert(e.response?.data?.message || 'Xatolik');
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Ism, username yoki email bo'yicha qidirish..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ flex: 1, padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text-1)', fontSize: '13px', fontFamily: 'Space Grotesk, sans-serif', outline: 'none' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--color-text-4)' }}>{pager.total ?? 0} ta</span>
            </div>

            {error && <p style={{ color: 'var(--color-red-bright)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            {['ID', 'Ism', 'Username', 'Email', 'Tur', 'Admin', 'Amallar'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-text-4)', fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-4)', fontSize: '13px' }}>Yuklanmoqda...</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-sub)', height: '48px' }}>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-4)' }}>{u.id}</td>
                                <td style={{ padding: '0 16px', fontSize: '13px', color: 'var(--color-text-2)' }}>{u.name}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-3)' }}>{u.username || '—'}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-3)' }}>{u.email || '—'}</td>
                                <td style={{ padding: '0 16px' }}>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: u.is_guest ? 'rgba(255,255,255,0.05)' : 'rgba(139,0,0,0.1)', color: u.is_guest ? 'var(--color-text-4)' : 'var(--color-red-bright)' }}>
                                        {u.is_guest ? 'Mehmon' : 'Ro\'yxatdan o\'tgan'}
                                    </span>
                                </td>
                                <td style={{ padding: '0 16px' }}>
                                    {u.is_admin ? <span style={{ fontSize: '11px', color: '#4CAF50' }}>✓ Admin</span> : <span style={{ fontSize: '11px', color: 'var(--color-text-5)' }}>—</span>}
                                </td>
                                <td style={{ padding: '0 16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => toggleAdmin(u)} style={{ fontSize: '10px', padding: '4px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text-3)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                                            {u.is_admin ? 'Admin olib tashlash' : 'Admin qilish'}
                                        </button>
                                        <button onClick={() => deleteUser(u)} style={{ fontSize: '10px', padding: '4px 10px', background: 'none', border: '1px solid rgba(196,30,58,0.3)', borderRadius: '2px', color: 'var(--color-red-bright)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                                            O'chirish
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(pager.last_page > 1) && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                    {Array.from({ length: pager.last_page }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', background: p === page ? 'var(--color-red)' : 'none', border: '1px solid var(--color-border)', borderRadius: '2px', color: p === page ? '#fff' : 'var(--color-text-3)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cinzel, serif' }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function RoomsTab() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = () => {
        setLoading(true);
        api.get('/admin/rooms').then(r => setRooms(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    };

    useEffect(() => { fetchRooms(); }, []);

    const forceEnd = async (code) => {
        if (!confirm(`${code} xonasini majburiy tugatish?`)) return;
        try { await api.post(`/admin/rooms/${code}/force-end`); fetchRooms(); }
        catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
    };

    const deleteRoom = async (code) => {
        if (!confirm(`${code} xonasini o'chirish?`)) return;
        try { await api.delete(`/admin/rooms/${code}`); fetchRooms(); }
        catch (e) { alert(e.response?.data?.message || 'Xatolik'); }
    };

    return (
        <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {['Kod', 'Holat', 'O\'yinchilar', 'Host', 'Sana', 'Amallar'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-text-4)', fontWeight: 500 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-4)', fontSize: '13px' }}>Yuklanmoqda...</td></tr>
                    ) : rooms.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-sub)', height: '48px' }}>
                            <td className="font-cinzel" style={{ padding: '0 16px', fontSize: '13px', color: 'var(--color-text-2)' }}>{r.code}</td>
                            <td style={{ padding: '0 16px' }}>
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: r.status === 'playing' ? 'rgba(139,0,0,0.1)' : r.status === 'finished' ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.05)', color: r.status === 'playing' ? 'var(--color-red-bright)' : r.status === 'finished' ? '#4CAF50' : 'var(--color-text-4)' }}>
                                    {r.status}
                                </span>
                            </td>
                            <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-3)' }}>{r.player_count}</td>
                            <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-3)' }}>{r.host?.name}</td>
                            <td style={{ padding: '0 16px', fontSize: '11px', color: 'var(--color-text-4)' }}>{new Date(r.created_at).toLocaleDateString('uz')}</td>
                            <td style={{ padding: '0 16px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {r.status !== 'finished' && (
                                        <button onClick={() => forceEnd(r.code)} style={{ fontSize: '10px', padding: '4px 10px', background: 'none', border: '1px solid rgba(196,30,58,0.3)', borderRadius: '2px', color: 'var(--color-red-bright)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                                            Tugatish
                                        </button>
                                    )}
                                    <button onClick={() => deleteRoom(r.code)} style={{ fontSize: '10px', padding: '4px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '2px', color: 'var(--color-text-3)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>
                                        O'chirish
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function HistoryTab() {
    const [history, setHistory] = useState([]);
    const [pager, setPager] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const roleColor = { mafia: '#EF5350', detective: '#64B5F6', doctor: '#81C784', citizen: '#888888' };

    useEffect(() => {
        setLoading(true);
        api.get('/admin/game-history', { params: { page } })
            .then(r => { setHistory(r.data.data || []); setPager(r.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page]);

    return (
        <div>
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            {['Xona', 'O\'yinchi', 'Rol', 'G\'olib', 'O\'yinchilar', 'Sana'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', color: 'var(--color-text-4)', fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-4)', fontSize: '13px' }}>Yuklanmoqda...</td></tr>
                        ) : history.map(h => (
                            <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border-sub)', height: '44px' }}>
                                <td className="font-cinzel" style={{ padding: '0 16px', fontSize: '13px', color: 'var(--color-text-2)' }}>{h.room_code}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-2)' }}>{h.user?.name}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: roleColor[h.role] || 'var(--color-text-3)' }}>{h.role}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: h.winner === 'mafia' ? '#EF5350' : '#4CAF50' }}>{h.winner}</td>
                                <td style={{ padding: '0 16px', fontSize: '12px', color: 'var(--color-text-3)' }}>{h.player_count}</td>
                                <td style={{ padding: '0 16px', fontSize: '11px', color: 'var(--color-text-4)' }}>{new Date(h.played_at).toLocaleDateString('uz')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(pager.last_page > 1) && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                    {Array.from({ length: pager.last_page }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', background: p === page ? 'var(--color-red)' : 'none', border: '1px solid var(--color-border)', borderRadius: '2px', color: p === page ? '#fff' : 'var(--color-text-3)', cursor: 'pointer', fontSize: '12px', fontFamily: 'Cinzel, serif' }}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Admin() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const [tab, setTab] = useState(0);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        api.get('/admin/dashboard').catch(e => {
            if (e.response?.status === 403) setAccessDenied(true);
        });
    }, []);

    if (accessDenied) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--color-red-bright)' }}>⛔ Admin huquqi yo'q</p>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Dashboard ga qaytish</button>
            </div>
        );
    }

    const tabComponents = [<DashboardTab />, <UsersTab />, <RoomsTab />, <HistoryTab />];

    return (
        <div style={{ minHeight: '100vh' }}>
            <nav className="nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <a href="/" className="nav-logo"><span>WHO IS</span>MAFIA</a>
                    <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)', borderRadius: '10px', color: 'var(--color-red-bright)', letterSpacing: '0.1em', fontFamily: 'Cinzel, serif' }}>ADMIN</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="theme-toggle" onClick={toggle}>{theme === 'dark' ? '☀ LIGHT' : '🌙 DARK'}</button>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-3)' }}>{user?.name}</span>
                    <button onClick={async () => { await logout(); navigate('/login'); }} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '11px' }}>
                        Chiqish
                    </button>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
                    {TABS.map((t, i) => (
                        <button
                            key={t}
                            onClick={() => setTab(i)}
                            style={{
                                padding: '10px 20px',
                                background: 'none',
                                border: 'none',
                                borderBottom: `2px solid ${i === tab ? 'var(--color-red)' : 'transparent'}`,
                                color: i === tab ? 'var(--color-text-1)' : 'var(--color-text-4)',
                                fontSize: '13px',
                                fontWeight: i === tab ? 600 : 400,
                                cursor: 'pointer',
                                fontFamily: 'Space Grotesk, sans-serif',
                                letterSpacing: '0.03em',
                                transition: 'color 0.15s',
                                marginBottom: '-1px',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {tabComponents[tab]}
            </main>
        </div>
    );
}
