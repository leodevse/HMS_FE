import { Center, Loader, Paper, Stack, Text } from '@mantine/core';

export function LoadingOverlay({ message = 'Loading...' }) {
    return (
        <Center mih="100vh" px="md" bg="gray.0">
            <Paper radius="md" shadow="sm" p="xl" withBorder>
                <Stack align="center" gap="sm">
                    <Loader size="lg" />
                    <Text c="dimmed" size="sm">
                        {message}
                    </Text>
                </Stack>
            </Paper>
        </Center>
    );
}