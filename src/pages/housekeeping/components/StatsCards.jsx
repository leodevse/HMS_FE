// src/pages/housekeeping/components/StatsCards.jsx
import { SimpleGrid, Paper, Group, Text, ThemeIcon } from '@mantine/core';
import { IconChecklist, IconClock, IconPlayerPlay, IconCheck } from '@tabler/icons-react';

export function StatsCards({ counts }) {
    const stats = [
        {
            label: 'Total Tasks',
            value: counts.total,
            icon: IconChecklist,
            color: 'blue',
            bg: 'blue.0'
        },
        {
            label: 'Scheduled',
            value: counts.scheduled,
            icon: IconClock,
            color: 'yellow',
            bg: 'yellow.0'
        },
        {
            label: 'In Progress',
            value: counts.inProgress,
            icon: IconPlayerPlay,
            color: 'grape',
            bg: 'grape.0'
        },
        {
            label: 'Completed',
            value: counts.completed,
            icon: IconCheck,
            color: 'green',
            bg: 'green.0'
        }
    ];

    return (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {stats.map((stat) => (
                <Paper key={stat.label} radius="lg" p="lg" withBorder bg={stat.bg}>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                {stat.label}
                            </Text>
                            <Text fw={700} size="28px">
                                {stat.value}
                            </Text>
                        </div>
                        <ThemeIcon size="xl" radius="md" color={stat.color} variant="light">
                            <stat.icon size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            ))}
        </SimpleGrid>
    );
}