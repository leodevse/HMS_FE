import { NavLink } from 'react-router-dom';
import { Stack, NavLink as MantineNavLink } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import {
    IconDashboard,
    IconHotelService,
    IconUsers,
    IconCalendarStats,
    IconReport,
    IconCoin,
    IconBed,
    IconCategory,
    IconTool,
    IconCalendarEvent, // Import icon cho phần Lịch làm việc
    IconListCheck      // Import thêm icon cho phần Quản lý Task
} from '@tabler/icons-react';

export function AdminSidebar() {
    const location = useLocation();
    const isRoomsRoute = location.pathname.startsWith('/admin/rooms');
    const dashboardItem = { label: 'Dashboard', icon: IconDashboard, to: '/admin' };

    const secondaryItems = [
        { label: 'Reservations', icon: IconCalendarStats, to: '/admin/reservations' },
        { label: 'Customers', icon: IconUsers, to: '/admin/customers' },
        { label: 'Staff', icon: IconUsers, to: '/admin/staff' },
        { label: 'Schedules', icon: IconCalendarEvent, to: '/admin/schedules' },
        { label: 'Tasks', icon: IconListCheck, to: '/admin/housekeeping-tasks' },
        { label: 'Payments', icon: IconCoin, to: '/admin/payments' },
        { label: 'Reports', icon: IconReport, to: '/admin/reports' },
    ];

    return (
        <Stack>
            <MantineNavLink
                component={NavLink}
                to={dashboardItem.to}
                end
                label={dashboardItem.label}
                leftSection={<dashboardItem.icon size={16} />}
                variant="light"
                active={location.pathname === dashboardItem.to}
            />

            <MantineNavLink
                label="Rooms"
                leftSection={<IconHotelService size={16} />}
                variant="light"
                defaultOpened={isRoomsRoute}
                active={isRoomsRoute}
            >
                <MantineNavLink
                    component={NavLink}
                    to="/admin/rooms"
                    end
                    label="Room Manage"
                    leftSection={<IconBed size={14} />}
                    variant="subtle"
                    active={location.pathname === '/admin/rooms'}
                />
                <MantineNavLink
                    component={NavLink}
                    to="/admin/rooms/types"
                    label="Room Types"
                    leftSection={<IconCategory size={14} />}
                    variant="subtle"
                    active={location.pathname === '/admin/rooms/types'}
                />
                <MantineNavLink
                    component={NavLink}
                    to="/admin/rooms/service"
                    label="Services"
                    leftSection={<IconTool size={14} />}
                    variant="subtle"
                    active={location.pathname === '/admin/rooms/service'}
                />
            </MantineNavLink>

            {secondaryItems.map((item) => (
                <MantineNavLink
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    end
                    label={item.label}
                    leftSection={<item.icon size={16} />}
                    variant="light"
                    active={location.pathname === item.to}
                />
            ))}
        </Stack>
    );
}