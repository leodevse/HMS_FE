import { Group, Title, Burger, Avatar, Menu, Text } from '@mantine/core';
import { IconLogout, IconUser, IconSettings } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth.jsx';

export function AdminHeader({ opened, toggle }) {
    const { user, logout } = useAuth();

    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <Title order={3}>HMS Admin</Title>
            </Group>

            <Menu shadow="md" width={200}>
                <Menu.Target>
                    <Group style={{ cursor: 'pointer' }}>
                        <Avatar color="blue" radius="xl">
                            {user?.customer?.fullName?.charAt(0) || 'A'}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                {user?.customer?.fullName || 'Admin'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {user?.email}
                            </Text>
                        </div>
                    </Group>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item leftSection={<IconUser size={14} />}>
                        Profile
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={14} />}>
                        Settings
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        color="red"
                        leftSection={<IconLogout size={14} />}
                        onClick={logout}
                    >
                        Logout
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    );
}