import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { Stack, NavLink as MantineNavLink } from '@mantine/core';
import {
    IconDashboard,
    IconClipboardList,
    IconCalendarStats,
    IconReport,
    IconBrush,
    IconAlertCircle,
    IconAsset
} from '@tabler/icons-react';

export function HousekeepingSidebar() {
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', icon: IconDashboard, path: '/housekeeping' },
        { label: 'Công việc', icon: IconClipboardList, path: '/housekeeping/tasks' },
        { label: 'Lịch trình', icon: IconCalendarStats, path: '/housekeeping/schedule' },
        { label: 'Trạng thái phòng', icon: IconBrush, path: '/housekeeping/cleaning' },
        { label: 'Bảo trì', icon: IconAlertCircle, path: '/housekeeping/maintenance' },
        { label: 'Kho vật tư', icon: IconAsset, path: '/housekeeping/inventory' },
        { label: 'Báo cáo', icon: IconReport, path: '/housekeeping/reports' },
    ];

    const isActive = (path) => {
        if (path === '/housekeeping') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <Stack>
            {navItems.map((item) => (
                <MantineNavLink
                    key={item.path}
                    component={RouterNavLink}
                    to={item.path}
                    label={item.label}
                    leftSection={<item.icon size={16} />}
                    variant="light"
                    active={isActive(item.path)}
                />
            ))}
        </Stack>
    );
}
