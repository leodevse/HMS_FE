// src/layouts/housekeeping/components/HousekeepingBottomNav.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, Group, ActionIcon, Badge, Text } from '@mantine/core';
import {
    IconHome,
    IconChecklist,
    IconCalendar,
    IconChartBar,
    IconUser
} from '@tabler/icons-react';
import { useHousekeepingTasks } from '../../hooks/useHousekeepingTasks';

export function HousekeepingBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { counts } = useHousekeepingTasks();

    const navItems = [
        {
            path: '/housekeeping',
            icon: IconHome,
            label: 'Home',
            badge: null
        },
        {
            path: '/housekeeping/tasks',
            icon: IconChecklist,
            label: 'Tasks',
            badge: counts.scheduled + counts.inProgress
        },
        {
            path: '/housekeeping/schedule',
            icon: IconCalendar,
            label: 'Schedule',
            badge: null
        },
        {
            path: '/housekeeping/reports',
            icon: IconChartBar,
            label: 'Reports',
            badge: null
        },
    ];

    const isActive = (path) => {
        if (path === '/housekeeping') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <Paper
            withBorder
            radius={0}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                backgroundColor: 'white',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)'
            }}
        >
            <Group justify="space-around" h={70} gap={0}>
                {navItems.map((item) => (
                    <ActionIcon
                        key={item.path}
                        variant="transparent"
                        size="xl"
                        radius="md"
                        style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            color: isActive(item.path)
                                ? 'var(--mantine-color-blue-6)'
                                : 'var(--mantine-color-gray-5)',
                            transition: 'all 0.2s ease',
                            transform: isActive(item.path) ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onClick={() => navigate(item.path)}
                    >
                        <div style={{ position: 'relative' }}>
                            <item.icon size={26} stroke={1.8} />
                            {item.badge > 0 && (
                                <Badge
                                    size="xs"
                                    color="red"
                                    variant="filled"
                                    style={{
                                        position: 'absolute',
                                        top: -10,
                                        right: -10,
                                        minWidth: 20,
                                        height: 20,
                                        padding: 0,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        border: '2px solid white'
                                    }}
                                >
                                    {item.badge > 9 ? '9+' : item.badge}
                                </Badge>
                            )}
                        </div>
                        <Text
                            size="xs"
                            fw={isActive(item.path) ? 600 : 400}
                            style={{
                                fontSize: 11,
                                letterSpacing: 0.3
                            }}
                        >
                            {item.label}
                        </Text>
                    </ActionIcon>
                ))}
            </Group>
        </Paper>
    );
}