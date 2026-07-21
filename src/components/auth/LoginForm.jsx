// src/components/auth/LoginForm.jsx
import { useState, useEffect, useRef } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
    Paper,
    Title,
    Text,
    Anchor,
    Divider,
    Stack,
    Box,
    Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBrandGoogle, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginForm() {
    const { login, isAuthenticated, getDashboardPath, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const hasNavigated = useRef(false);

    const resolveRedirectPath = (fromPath, fallbackPath) => {
        // Only allow app-internal, non-auth paths from router state.
        if (typeof fromPath !== 'string' || !fromPath.startsWith('/')) {
            return fallbackPath;
        }

        const blockedPaths = new Set([
            '/login',
            '/register',
            '/forgot-password',
            '/forgot-pasword',
            '/oauth2/redirect',
            '/404',
            '/unauthorized',
        ]);

        if (blockedPaths.has(fromPath)) {
            return fallbackPath;
        }

        return fromPath;
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !hasNavigated.current) {
            hasNavigated.current = true;
            const dashboardPath = getDashboardPath(user) || '/';
            const from = resolveRedirectPath(location.state?.from, dashboardPath);

            // Dùng navigate để chuyển trang (KHÔNG reload)
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, location.state, navigate, getDashboardPath]);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },
        validate: {
            username: (value) => (value.trim() ? null : 'Username is required'),
            password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        setError(null);

        const result = await login(values.username.trim(), values.password);
        setLoading(false);

        if (result.success) {
            console.log('✅ Login success - user:', result.user);

            notifications.show({
                title: 'Welcome back!',
                message: `Logged in as ${result.user.fullName || result.user.username}`,
                color: 'green',
            });

            // KHÔNG CẦN navigate ở đây nữa vì useEffect sẽ xử lý
        } else {
            setError(result.error);
        }
    };

    const handleGoogleLogin = () => {
        const beUrl = import.meta.env.VITE_BE_URL || 'http://localhost:8080';
        window.location.href = `${beUrl}/oauth2/authorization/google`;
    };

    return (
        <Box style={{ maxWidth: 400 }} mx="auto">
            <Paper radius="md" p="xl">
                <Title order={2} ta="center" mb="md">
                    Welcome Back!
                </Title>

                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Login Failed"
                        color="red"
                        mb="md"
                        withCloseButton
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <TextInput
                            required
                            label="Email / Username"
                            placeholder="your@email.com"
                            autoComplete="username"
                            {...form.getInputProps('username')}
                        />

                        <PasswordInput
                            required
                            label="Password"
                            placeholder="Your password"
                            autoComplete="current-password"
                            {...form.getInputProps('password')}
                        />

                        <Anchor
                            component="button"
                            type="button"
                            size="sm"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </Anchor>

                        <Button type="submit" fullWidth loading={loading}>
                            Sign in
                        </Button>
                    </Stack>
                </form>

                <Divider label="Or" labelPosition="center" my="lg" />

                <Button
                    fullWidth
                    variant="default"
                    onClick={handleGoogleLogin}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                </Button>

                <Text ta="center" mt="md">
                    Don't have an account?{' '}
                    <Anchor component="button" onClick={() => navigate('/register')}>
                        Register
                    </Anchor>
                </Text>
            </Paper>
        </Box>
    );
}
