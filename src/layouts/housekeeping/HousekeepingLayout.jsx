// src/layouts/housekeeping/HousekeepingLayout.jsx
import { Outlet } from 'react-router-dom';
import { AppShell, Container, Box } from '@mantine/core';
import { HousekeepingHeader } from './HousekeepingHeader';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { HousekeepingBottomNav } from './HousekeepingBottomNav';

export function HousekeepingLayout() {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'HOUSEKEEPING') {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <AppShell
            header={{ height: 70 }}
            footer={{ height: 80 }}
            padding={0}
            styles={{
                main: {
                    background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)'
                }
            }}
        >
            <AppShell.Header withBorder={false}>
                <HousekeepingHeader />
            </AppShell.Header>

            <AppShell.Main>
                <Box
                    style={{
                        padding: '20px 16px 90px 16px',
                        minHeight: 'calc(100vh - 150px)'
                    }}
                >
                    <Outlet />
                </Box>
            </AppShell.Main>

            <AppShell.Footer withBorder={false}>
                <HousekeepingBottomNav />
            </AppShell.Footer>
        </AppShell>
    );
}