// src/layouts/housekeeping/components/HousekeepingHeader.jsx
import { Group, Title, Avatar, Menu, Text, Badge, Indicator, Box } from '@mantine/core';
import { IconBell, IconChecklist, IconUser, IconLogout, IconCalendar } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useHousekeepingTasks } from '../../hooks/useHousekeepingTasks';

export function HousekeepingHeader() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { counts } = useHousekeepingTasks();

    return (
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            {/* Logo và Title */}
            <Group gap="xs" wrap="nowrap">
                <Box
                    style={{
                        background: 'linear-gradient(135deg, #228be6 0%, #15aabf 100%)',
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 18
                    }}
                >
                    H
                </Box>
                <div>
                    <Title order={3} size="h5" style={{ lineHeight: 1.2 }}>FPTU Hotel</Title>
                    <Badge
                        color="blue"
                        size="xs"
                        variant="light"
                        style={{ marginTop: 2 }}
                    >
                        Housekeeping
                    </Badge>
                </div>
            </Group>

            {/* Right Section */}
            <Group gap="xs" wrap="nowrap">
                {/* Notification Bell with Task Count */}
                <Indicator
                    label={counts.scheduled + counts.inProgress}
                    size={18}
                    color="red"
                    offset={4}
                    disabled={counts.scheduled + counts.inProgress === 0}
                    styles={{
                        indicator: {
                            fontSize: 10,
                            fontWeight: 700
                        }
                    }}
                >
                    <Box
                        style={{
                            backgroundColor: 'var(--mantine-color-gray-1)',
                            borderRadius: 12,
                            padding: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: 'var(--mantine-color-gray-2)'
                            }
                        }}
                    >
                        <IconBell size={20} stroke={1.5} />
                    </Box>
                </Indicator>

                {/* User Menu */}
                <Menu shadow="lg" width={240} position="bottom-end" withArrow>
                    <Menu.Target>
                        <Avatar
                            size="md"
                            radius="xl"
                            color="blue"
                            style={{
                                cursor: 'pointer',
                                border: '2px solid var(--mantine-color-blue-2)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: 'var(--mantine-color-blue-6)'
                                }
                            }}
                        >
                            {user?.fullName?.charAt(0)}
                        </Avatar>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label px="md" py="xs">
                            <Group gap="sm">
                                <Avatar size="md" color="blue" radius="xl">
                                    {user?.fullName?.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={600}>{user?.fullName}</Text>
                                    <Text size="xs" c="dimmed">{user?.email}</Text>
                                </div>
                            </Group>
                        </Menu.Label>

                        <Menu.Divider />

                        <Menu.Item
                            leftSection={<IconUser size={18} color="var(--mantine-color-violet-6)" />}
                            onClick={() => navigate('/housekeeping/profile')}
                            py="xs"
                        >
                            Profile
                        </Menu.Item>

                        <Menu.Divider />

                        <Menu.Item
                            color="red"
                            leftSection={<IconLogout size={18} />}
                            onClick={logout}
                            py="xs"
                        >
                            Logout
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
    );
}