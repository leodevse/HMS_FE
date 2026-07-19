import { useState, useEffect } from 'react';
import { Title, Paper, Grid, Card, Text, SimpleGrid, Group, Table, Badge, LoadingOverlay, ActionIcon, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
    IconHotelService, IconUsers, IconCalendarStats, IconCurrencyDollar,
    IconDoorExit, IconAlertTriangle, IconPercentage, IconCashBanknote, IconArrowRight
} from '@tabler/icons-react';

import { dashboardApi } from '../../apis/admin/dashboardApi';
import { refundApi } from '../../apis/admin/refundApi'; // Đảm bảo bạn đã có file này
import { notifications } from '@mantine/notifications';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stats: null,
        recentBookings: []
    });
    const [pendingRefunds, setPendingRefunds] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Gọi song song cả 2 API để tối ưu thời gian load
            const [dashboardRes, refundsRes] = await Promise.all([
                dashboardApi.getDashboardData(),
                refundApi.getPendingRefunds({ page: 0, size: 5 }) // Chỉ lấy 5 requests đầu tiên
            ]);

            setDashboardData(dashboardRes || { stats: null, recentBookings: [] });
            setPendingRefunds(refundsRes?.content || []);
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
        { title: 'Tổng số phòng', value: statsData.totalRooms, icon: IconHotelService, color: 'blue' },
        { title: 'Phòng đang có khách', value: statsData.occupiedRooms, icon: IconHotelService, color: 'indigo' },
        { title: 'Tỷ lệ lấp đầy', value: `${occupancyRate}%`, icon: IconPercentage, color: 'teal' },
        { title: 'Phòng bẩn (Cần dọn)', value: statsData.dirtyRooms, icon: IconAlertTriangle, color: 'red' },
        { title: 'Khách Check-in HN', value: statsData.checkInsToday, icon: IconCalendarStats, color: 'green' },
        { title: 'Khách Check-out HN', value: statsData.checkOutsToday, icon: IconDoorExit, color: 'orange' },
        { title: 'Tổng số khách lưu trú', value: statsData.totalGuests, icon: IconUsers, color: 'cyan' },
        { title: 'Doanh thu hôm nay', value: formatCurrency(statsData.revenueToday), icon: IconCurrencyDollar, color: 'violet' },
        { title: 'Đặt phòng chờ duyệt', value: statsData.pendingReservations, icon: IconCalendarStats, color: 'yellow' },
    ] : [];

    // Helper render Status Badge cho Booking
    const renderBookingStatus = (status) => {
        const colors = { CONFIRMED: 'blue', PENDING: 'orange', CANCELLED: 'red', CHECKED_IN: 'green', CHECKED_OUT: 'gray' };
        return <Badge color={colors[status] || 'gray'} variant="light">{status}</Badge>;
    };

    return (
        <div style={{ position: 'relative', minHeight: '500px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} />
            <Title order={2} mb="lg">Dashboard Tổng quan</Title>

            {/* LƯỚI THỐNG KÊ */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md" mb="xl">
                {statsCards.map((stat) => (
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
                    </Card>
                ))}
            </SimpleGrid>

            {/* BẢNG DỮ LIỆU */}
            <Grid gutter="md">
                {/* Cột 1: Recent Bookings (Chiếm 7 phần) */}
                <Grid.Col span={{ base: 12, lg: 7 }}>
                    <Paper shadow="sm" p="md" withBorder style={{ height: '100%' }}>
                        <Title order={4} mb="md">Đặt phòng gần đây</Title>
                        <div style={{ overflowX: 'auto' }}>
                            <Table striped highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Mã</Table.Th>
                                        <Table.Th>Khách hàng</Table.Th>
                                        <Table.Th>Check-In (Dự kiến)</Table.Th>
                                        <Table.Th>Trạng thái</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {dashboardData.recentBookings.length > 0 ? dashboardData.recentBookings.map((b) => (
                                        <Table.Tr key={b.reservationId}>
                                            <Table.Td fw={600}>{b.code}</Table.Td>
                                            <Table.Td>{b.customerName}</Table.Td>
                                            <Table.Td>{formatDate(b.expectedCheckIn)}</Table.Td>
                                            <Table.Td>{renderBookingStatus(b.status)}</Table.Td>
                                        </Table.Tr>
                                    )) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={4} ta="center" py="xl"><Text c="dimmed">Không có lượt đặt phòng nào gần đây</Text></Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Paper>
                </Grid.Col>

                {/* Cột 2: Pending Refunds (Chiếm 5 phần) */}
                <Grid.Col span={{ base: 12, lg: 5 }}>
                    <Paper shadow="sm" p="md" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Group justify="space-between" mb="md">
                            <Group gap="xs">
                                <IconCashBanknote size={20} color="red" />
                                <Title order={4}>Yêu cầu hoàn tiền cần duyệt</Title>
                            </Group>
                            <Tooltip label="Đến trang quản lý">
                                <ActionIcon variant="light" color="blue" onClick={() => navigate('/admin/payments?tab=refunds')}>
                                    <IconArrowRight size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>

                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <Table highlightOnHover verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Khách yêu cầu</Table.Th>
                                        <Table.Th>Số tiền</Table.Th>
                                        <Table.Th>Ngày tạo</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {pendingRefunds.length > 0 ? pendingRefunds.map((refund) => (
                                        <Table.Tr key={refund.id}>
                                            <Table.Td fw={500}>{refund.requestedByName}</Table.Td>
                                            <Table.Td fw={700} c="red">{formatCurrency(refund.amount)}</Table.Td>
                                            <Table.Td c="dimmed" size="sm">{formatDate(refund.createdAt)}</Table.Td>
                                        </Table.Tr>
                                    )) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={3} ta="center" py="xl"><Text c="dimmed">Không có yêu cầu hoàn tiền nào đang chờ</Text></Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Paper>
                </Grid.Col>
            </Grid>
        </div>
    );
}