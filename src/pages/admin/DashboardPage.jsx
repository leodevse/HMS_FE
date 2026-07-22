import { useState, useEffect } from 'react';
import { Title, Paper, Grid, Card, Text, SimpleGrid, Group, Table, Badge, LoadingOverlay, Progress, Button, Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
    IconHotelService, IconUsers, IconCalendarStats, IconCurrencyDollar,
    IconDoorExit, IconAlertTriangle, IconPercentage
} from '@tabler/icons-react';

import { dashboardApi } from '../../apis/admin/dashboardApi';
import { notifications } from '@mantine/notifications';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stats: null,
        recentBookings: []
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const dashboardRes = await dashboardApi.getDashboardData();
            setDashboardData(dashboardRes || { stats: null, recentBookings: [] });
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Không thể tải dữ liệu Dashboard', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

    // Tính toán Occupancy Rate
    const statsData = dashboardData.stats;
    const occupancyRate = statsData && statsData.totalRooms > 0
        ? ((statsData.occupiedRooms / statsData.totalRooms) * 100).toFixed(1)
        : 0;

    // Cấu hình các thẻ Stats dựa trên dữ liệu trả về
    const statsCards = statsData ? [
        { title: 'Total Rooms', value: statsData.totalRooms ?? 0, icon: IconHotelService, color: 'blue' },
        { title: 'Staff', value: statsData.totalStaff ?? 0, icon: IconUsers, color: 'indigo' },
        { title: 'Current Customer', value: statsData.currentGuests ?? 0, icon: IconUsers, color: 'teal' },
        { title: 'Bookings', value: statsData.bookingsToday ?? 0, icon: IconCalendarStats, color: 'green' },
        { title: 'Occupied Rooms', value: statsData.occupiedRooms ?? 0, icon: IconHotelService, color: 'blue' },
        { title: 'Dirty Rooms', value: statsData.dirtyRooms ?? 0, icon: IconAlertTriangle, color: 'red' },
        { title: 'Check-ins Today', value: statsData.checkInsToday ?? 0, icon: IconCalendarStats, color: 'orange' },
        { title: 'Check-outs Today', value: statsData.checkOutsToday ?? 0, icon: IconDoorExit, color: 'violet' },
        { title: 'Revenue Today', value: formatCurrency(statsData.revenueToday ?? 0), icon: IconCurrencyDollar, color: 'cyan' },
    ] : [];

    const getDetailPath = (title) => {
        switch (title) {
            case 'Total Rooms':
                return '/admin/rooms';
            case 'Staff':
                return '/admin/staff';
            case 'Current Customer':
                return '/admin/customers';
            case 'Bookings':
                return '/admin/reservations';
            default:
                return null;
        }
    };

    const dirtyRatio = statsData?.totalRooms ? ((statsData.dirtyRooms ?? 0) / statsData.totalRooms) * 100 : 0;
    const readyRatio = statsData?.totalRooms ? ((statsData.readyRooms ?? 0) / statsData.totalRooms) * 100 : 0;
    const bookedRatio = statsData?.totalRooms ? ((statsData.bookedRooms ?? 0) / statsData.totalRooms) * 100 : 0;

    const colorPalette = ['blue', 'green', 'teal', 'orange', 'violet', 'red', 'cyan', 'grape'];

    const roomTypes = statsData?.roomTypeCounts
        ? Object.entries(statsData.roomTypeCounts).map(([label, value], index) => ({
            label,
            value,
            color: colorPalette[index % colorPalette.length],
        }))
        : [
            { label: 'Deluxe Room', value: 0, color: 'blue' },
            { label: 'Family Room', value: 0, color: 'green' },
            { label: 'Standard Room', value: 0, color: 'teal' },
        ];

    const roomTypeTotal = roomTypes.reduce((sum, roomType) => sum + roomType.value, 0);
    const pieCircumference = 2 * Math.PI * 16;
    const pieSegments = [];
    let pieOffset = 0;

    if (roomTypeTotal > 0) {
        roomTypes.forEach((roomType) => {
            const segmentLength = (roomType.value / roomTypeTotal) * pieCircumference;
            pieSegments.push({
                ...roomType,
                dashArray: `${segmentLength} ${pieCircumference - segmentLength}`,
                dashOffset: pieOffset,
            });
            pieOffset -= segmentLength;
        });
    }

    // Helper render Status Badge cho Booking
    const renderBookingStatus = (status) => {
        const colors = { CONFIRMED: 'blue', PENDING: 'orange', CANCELLED: 'red', CHECKED_IN: 'green', CHECKED_OUT: 'gray' };
        return <Badge color={colors[status] || 'gray'} variant="light">{status}</Badge>;
    };

    return (
        <div style={{ position: 'relative', minHeight: '500px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} />
            <Title order={2} mb="lg">Dashboard Overview</Title>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
                {statsCards.slice(0, 4).map((stat) => {
                    const detailPath = getDetailPath(stat.title);
                    return (
                        <Card key={stat.title} shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="xs">
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                    {stat.title}
                                </Text>
                                <stat.icon size={20} color={`var(--mantine-color-${stat.color}-6)`} />
                            </Group>
                            <Text size="xl" fw={700} c={stat.color}>
                                {stat.value}
                            </Text>
                            {detailPath && (
                                <Button
                                    size="xs"
                                    variant="light"
                                    mt="md"
                                    onClick={() => navigate(detailPath)}
                                >
                                    Detail
                                </Button>
                            )}
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Grid gutter="md">
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Paper shadow="sm" p="md" withBorder>
                        <Group position="apart" mb="md">
                            <div>
                                <Text size="lg" fw={700}>Today Booking Status</Text>
                                <Text size="sm" c="dimmed">Track the current booking progress for today</Text>
                            </div>
                        </Group>

                        <Box mb="md">
                            <Text size="sm" mb="4">Dirty</Text>
                            <Progress value={dirtyRatio} size="lg" color="red" mb="sm" />
                            <Text size="sm" mb="4">Ready</Text>
                            <Progress value={readyRatio} size="lg" color="green" mb="sm" />
                            <Text size="sm" mb="4">Booked</Text>
                            <Progress value={bookedRatio} size="lg" color="blue" />
                        </Box>
                    </Paper>

                    <Paper shadow="sm" p="md" withBorder mt="md">
                        <Title order={4} mb="md">Latest Booking</Title>
                        <div style={{ overflowX: 'auto' }}>
                            <Table striped highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Name</Table.Th>
                                        <Table.Th>Booking Type</Table.Th>
                                        <Table.Th>Date of Number</Table.Th>
                                        <Table.Th>Bookeet Time</Table.Th>
                                        <Table.Th>Details</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {dashboardData.recentBookings.length > 0 ? dashboardData.recentBookings.map((b) => (
                                        <Table.Tr key={b.reservationId || b.id || b.code}>
                                            <Table.Td fw={600}>{b.customerName || b.code || 'Guest'}</Table.Td>
                                            <Table.Td>{b.bookingType || b.type || 'Room'}</Table.Td>
                                            <Table.Td>{formatDate(b.expectedCheckIn || b.checkInDate || b.createdAt)}</Table.Td>
                                            <Table.Td>{formatDate(b.bookedAt || b.createdAt)}</Table.Td>
                                            <Table.Td>
                                                <Button size="xs" variant="outline" compact onClick={() => navigate(`/admin/reservations/${b.reservationId || b.id}`)}>
                                                    View
                                                </Button>
                                            </Table.Td>
                                        </Table.Tr>
                                    )) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={5} ta="center" py="xl"><Text c="dimmed">No booking data available</Text></Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Paper shadow="sm" p="md" withBorder style={{ minHeight: '100%' }}>
                        <Title order={4} mb="md">Room Statistics</Title>
                        <Text size="sm" c="dimmed" mb="md">Room distribution by room type</Text>
                        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <Box style={{ width: 200, height: 200, position: 'relative' }}>
                                <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
                                    {pieSegments.map((segment) => (
                                        <circle
                                            key={segment.label}
                                            r="16"
                                            cx="16"
                                            cy="16"
                                            fill="transparent"
                                            stroke={segment.color}
                                            strokeWidth="8"
                                            strokeDasharray={segment.dashArray}
                                            strokeDashoffset={segment.dashOffset}
                                            transform="rotate(-90 16 16)"
                                            strokeLinecap="butt"
                                        />
                                    ))}
                                    <circle
                                        r="10"
                                        cx="16"
                                        cy="16"
                                        fill="white"
                                    />
                                </svg>
                                <Box style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <Text size="sm" c="dimmed">Total</Text>
                                    <Text fw={700}>{roomTypeTotal}</Text>
                                </Box>
                            </Box>
                        </Box>
                        <Box mt="md">
                            {roomTypes.map((roomType) => (
                                <Group key={roomType.label} position="apart" mb="xs">
                                    <Group spacing="xs">
                                        <Box style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: roomType.color }} />
                                        <Text size="sm">{roomType.label}</Text>
                                    </Group>
                                    <Text size="sm" fw={700}>{roomType.value}</Text>
                                </Group>
                            ))}
                        </Box>
                    </Paper>
                </Grid.Col>
            </Grid>
        </div>
    );
}