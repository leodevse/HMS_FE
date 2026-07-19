import {useReceptionistLayout} from "../../hooks/receptionist/layout/use-receptionist-layout.jsx";
import {NavLink} from "react-router-dom"; // Thêm useNavigate
import {AppShell, Avatar, Burger, Group, Menu, rem, Text, UnstyledButton} from "@mantine/core";
import {RECEPTIONIST_NAVBAR_ITEMS} from "../../constants/receptionist.jsx";
import {Hotel} from "lucide-react";
import {IconLogout, IconSettings, IconUser} from "@tabler/icons-react";
import {useAuth} from "../../hooks/useAuth.jsx"; // Thêm icon cho đẹp

export const ReceptionistHeader = () => {
    const {isMobileOpen, toggle} = useReceptionistLayout();
    const {logout} = useAuth();

    return (
            <AppShell.Header withBorder>
                <Group h="100%" px="md" justify="space-between">
                    {/* LEFT */}
                    <Group>
                        <Burger
                                opened={isMobileOpen}
                                onClick={toggle}
                                hiddenFrom="lg"
                                size="sm"
                        />

                        <Group gap="xs">
                            <Hotel size={28} color="var(--mantine-color-teal-6)"/>
                            <Text fw={600} size="lg">HMS</Text>
                            <Text size="sm" c="dimmed" visibleFrom="xs">
                                | Staff Portal
                            </Text>
                        </Group>
                    </Group>

                    {/* DESKTOP NAV */}
                    <Group visibleFrom="lg" gap={4}>
                        {RECEPTIONIST_NAVBAR_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                    <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({isActive}) => `
                                    flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
                                    ${isActive
                                                    ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                            }
                                `}
                                    >
                                        <Icon size={18}/>
                                        {item.label}
                                    </NavLink>
                            )
                        })}
                    </Group>

                    {/* AVATAR WITH LOGOUT MENU */}
                    <Menu shadow="md" width={200} position="bottom-end" transitionProps={{transition: 'pop-top-right'}}>
                        <Menu.Target>
                            <UnstyledButton style={{borderRadius: '50%'}}>
                                <Avatar color="teal" radius="xl" src={null} alt="User profile"
                                        style={{cursor: 'pointer'}}>
                                    S
                                </Avatar>
                            </UnstyledButton>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Label>Application</Menu.Label>
                            <Menu.Item leftSection={<IconUser style={{width: rem(14), height: rem(14)}}/>}>
                                My Profile
                            </Menu.Item>
                            <Menu.Item leftSection={<IconSettings style={{width: rem(14), height: rem(14)}}/>}>
                                Settings
                            </Menu.Item>

                            <Menu.Divider/>

                            <Menu.Label>Danger zone</Menu.Label>
                            <Menu.Item
                                    color="red"
                                    onClick={logout}
                                    leftSection={<IconLogout style={{width: rem(14), height: rem(14)}}/>}
                            >
                                Logout
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </AppShell.Header>
    );
}