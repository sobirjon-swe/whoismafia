import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Results from './pages/Results';
import Admin from './pages/Admin';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--color-text-3)', fontFamily: 'Cinzel, serif' }}>YUKLANMOQDA...</p></div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"            element={<Landing />} />
                <Route path="/login"       element={<Login />} />
                <Route path="/register"    element={<Register />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/lobby/:code" element={<PrivateRoute><Lobby /></PrivateRoute>} />
                <Route path="/game/:code"  element={<PrivateRoute><Game /></PrivateRoute>} />
                <Route path="/results/:code" element={<PrivateRoute><Results /></PrivateRoute>} />
                <Route path="/admin"       element={<PrivateRoute><Admin /></PrivateRoute>} />
                <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
