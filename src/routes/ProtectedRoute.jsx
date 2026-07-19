// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingOverlay } from '../components/common/LoadingOverlay';

export function ProtectedRoute({ children, requiredRole }) {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    const normalizeRole = (role) => String(role || '').replace(/^ROLE_/, '').toUpperCase();

    console.log('ProtectedRoute - requiredRole:', requiredRole);
    console.log('ProtectedRoute - user:', user);
    console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
    console.log('ProtectedRoute - path:', location.pathname);

    if (loading) {
        return <LoadingOverlay />;
    }

    if (!isAuthenticated) {
        console.log('ProtectedRoute - Not authenticated, redirecting to login');
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (requiredRole && normalizeRole(user?.role) !== normalizeRole(requiredRole)) {
        console.log(`ProtectedRoute - Access denied: Required ${requiredRole}, but user has ${user?.role}`);
        return <Navigate to="/unauthorized" replace />;
    }

    console.log('ProtectedRoute - Access granted');
    return children;
}