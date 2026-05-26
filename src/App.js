import './App.css';
import React, { lazy, Suspense, useEffect, Component } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const Login = lazy(() => import('./components/login/login'));
const CalendarComponent = lazy(() => import('./components/agendamento/calendar/calendarComponent'));
const Profissional = lazy(() => import('./components/agendamento/Profissional/profissional'));
const Servico = lazy(() => import('./components/agendamento/service/servico'));
const AppRoutes = lazy(() => import('./routes/Routes'));
const AdminDashboard = lazy(() => import('./administrador/painel/AdminDashboard'));

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LogoHeader from './components/Layout/LogoHeader';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useAuth } from './hooks/useAuth';
import PendingRequestsNotifier from './administrador/components/servicos/PendingRequestsNotifier';
import { OfflineBanner } from './components/OfflineBanner';

// Error Boundary para capturar erros
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary capturou erro:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red' }}>
                    <h1>Algo deu errado!</h1>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

function App() {
    return (
        <ErrorBoundary>
            <OfflineBanner />
            <AuthProvider>
                <ThemeProvider>
                    <Router>
                        <MainLayout />
                    </Router>
                </ThemeProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

function MainLayout() {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const notifier = user ? <PendingRequestsNotifier /> : null;
    const showPanelBrand = !!user && !location.pathname.startsWith('/agendar');
    const footer = (
        <footer className="app-footer">
            <div className="app-footer__inner">
                <span className="app-footer__brand">Martirio Solucoes em Tecnologia</span>
                <span className="app-footer__meta">Copyright (c) 2026. Todos os direitos reservados.</span>
                <span className="app-footer__version">Versao 1.0</span>
            </div>
        </footer>
    );

    useEffect(() => {
        document.title = user?.name || 'Meu Barbeiro';
    }, [user?.name]);

    // Limpeza de backgrounds problemáticos na inicialização
    useEffect(() => {
        const savedBackground = localStorage.getItem('backgroundImage');
        if (savedBackground && savedBackground.includes('background-')) {
            console.log('Limpando background problemático do localStorage');
            localStorage.removeItem('backgroundImage');
        }
    }, []);

    // Verifica se é uma rota pública (login, cadastro, etc)
    const isPublicRoute = !user || location.pathname === '/login' || 
                         location.pathname === '/register' || 
                         location.pathname === '/forgot-password';

    if (!authReady) {
        return <div className="loading-container">Carregando...</div>;
    }

    if (!user) {
        // Só mostra o login se não estiver autenticado
        return (
            <div className="public-route-container">
                <Suspense fallback={<div className="loading-container">Carregando...</div>}>
                    <AppRoutes />
                </Suspense>
                {footer}
            </div>
        );
    }

    // Se estiver na rota /dashboard, renderiza só o dashboard (sem layout extra)
    if (location.pathname === '/dashboard') {
        return (
            <div className="app-container">
                {notifier}
                {showPanelBrand && <LogoHeader />}
                <Suspense fallback={<div className="loading-container">Carregando Dashboard...</div>}>
                    <AdminDashboard />
                </Suspense>
                {footer}
            </div>
        );
    }

    // Demais rotas privadas mantêm layout global
    return (
        <div className="app-container">
            {/* Header e Sidebar devem ser gerenciados em cada rota ou no Routes */}
            {notifier}
            {showPanelBrand && <LogoHeader />}
            <Suspense fallback={<div className="loading-container">Carregando...</div>}>
                <AppRoutes />
            </Suspense>
            {footer}
        </div>
    );
}

export default App;