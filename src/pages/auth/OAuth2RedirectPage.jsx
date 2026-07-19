import {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Center, Loader, Stack, Text} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {jwtDecode} from 'jwt-decode';

export default function OAuth2RedirectPage() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const token = params.get('token');
                const error = params.get('error');

                console.log('OAuth2 - Token received:', !!token);

                if (error) {
                    notifications.show({
                        title: 'Error',
                        message: decodeURIComponent(error),
                        color: 'red',
                    });
                    navigate('/login', {replace: true});
                    return;
                }

                if (!token) {
                    notifications.show({
                        title: 'Error',
                        message: 'No token received',
                        color: 'red',
                    });
                    navigate('/login', {replace: true});
                    return;
                }

                const decodedToken = token;
                const decoded = jwtDecode(decodedToken);

                if (!decoded.exp || decoded.exp * 1000 <= Date.now()) {
                    throw new Error('Received an expired token');
                }

                const rawRole = Array.isArray(decoded.roles)
                        ? decoded.roles[0]
                        : (decoded.roles || decoded.role);
                const normalizedRole = String(rawRole || '')
                        .replace(/^ROLE_/, '')
                        .toUpperCase();

                if (!normalizedRole) {
                    throw new Error('Token does not contain a role');
                }

                localStorage.setItem('accessToken', decodedToken);
                localStorage.setItem('authUser', JSON.stringify({
                    id: decoded.userId,
                    username: decoded.sub,
                    role: normalizedRole,
                }));

                console.log('OAuth2 - Token saved, redirecting...');

                const redirectPath =
                        normalizedRole === 'ADMIN' ? '/admin' :
                                normalizedRole === 'HOUSEKEEPING' ? '/housekeeping' :
                                        normalizedRole === 'RECEPTIONIST' ? '/receptionist' :
                                                normalizedRole === 'STAFF' ? '/staff' :
                                                normalizedRole === 'CUSTOMER' || normalizedRole === 'USER' ? '/' :
                                                        '/';

                window.location.href = redirectPath;

            } catch (error) {
                console.error('OAuth2 error:', error);
                notifications.show({
                    title: 'Error',
                    message: 'Authentication failed',
                    color: 'red',
                });
                navigate('/login', {replace: true});
            }
        };
        handleRedirect()
    }, [location.search, navigate]);

    return (
            <Center style={{height: '100vh'}}>
                <Stack align="center">
                    <Loader size="xl"/>
                    <Text size="lg">Completing Google login...</Text>
                </Stack>
            </Center>
    );
}
