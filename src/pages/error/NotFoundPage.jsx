import { Container, Title, Text, Button, Group, Paper, Stack } from '@mantine/core';
import { IconMoodSad, IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { user, getDashboardPath } = useAuth();

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        if (user) {
            navigate(getDashboardPath());
        } else {
            navigate('/user');
        }
    };

    return (
        <Container size="md" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Paper withBorder p="xl" radius="md" style={{ width: '100%' }}>
                <Stack align="center" gap="lg">
                    {/* Icon */}
                    <div style={{
                        backgroundColor: 'var(--mantine-color-yellow-1)',
                        borderRadius: '50%',
                        padding: '20px',
                        display: 'inline-block'
                    }}>
                        <IconMoodSad size={64} color="var(--mantine-color-yellow-6)" stroke={1.5} />
                    </div>

                    {/* Error code */}
                    <Title order={1} size={48} c="yellow.6">404</Title>

                    {/* Title */}
                    <Title order={2} ta="center">
                        Page Not Found
                    </Title>

                    {/* Message */}
                    <Text size="lg" c="dimmed" ta="center" maw={400}>
                        The page you are looking for doesn't exist or has been moved.
                    </Text>

                    {/* Search suggestion */}
                    <Paper withBorder p="md" bg="gray.0" w="100%">
                        <Text size="sm" ta="center">
                            🔍 You might want to check:
                        </Text>
                        <Group justify="center" mt="xs" gap="xs">
                            <Button variant="subtle" size="xs" onClick={() => navigate('/user/rooms')}>
                                Our Rooms
                            </Button>
                            <Button variant="subtle" size="xs" onClick={() => navigate('/about')}>
                                About Us
                            </Button>
                            <Button variant="subtle" size="xs" onClick={() => navigate('/contact')}>
                                Contact
                            </Button>
                        </Group>
                    </Paper>

                    {/* Actions */}
                    <Group justify="center" mt="md">
                        <Button
                            variant="light"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={handleGoBack}
                        >
                            Go Back
                        </Button>
                        <Button
                            leftSection={<IconHome size={16} />}
                            onClick={handleGoHome}
                        >
                            {user ? 'Go to Dashboard' : 'Go to Home'}
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}