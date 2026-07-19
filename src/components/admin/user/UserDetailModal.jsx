import { Modal, Text, Grid, Badge, Stack, Table, Title, Divider } from '@mantine/core';

export function UserDetailModal({ opened, onClose, user }) {
    if (!user) return null;

    // Hàm format timestamp sang ngày tháng hiển thị
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('vi-VN');
    };

    // Hàm chọn màu badge dựa trên trạng thái đặt phòng
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'green';
            case 'CHECKED_IN': return 'blue';
            case 'CHECKED_OUT': return 'gray';
            case 'CANCELLED': return 'red';
            case 'PENDING': return 'yellow';
            default: return 'gray';
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Chi tiết Người dùng" size="xl" radius="md">
            <Stack spacing="sm">
                <Title order={5} c="blue">Thông tin cá nhân</Title>
                <Grid>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>ID:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.id}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Họ và tên:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.fullName || 'Chưa cập nhật'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Email:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.email}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Số điện thoại:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.phoneNumber || 'Chưa cập nhật'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>CCCD/CMND:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.identityCard || 'Chưa cập nhật'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Provider (Nguồn):</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.provider || 'LOCAL'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Vai trò (Role):</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                        <Badge color="violet" variant="light">{user.role}</Badge>
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Trạng thái:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                        <Badge color={user.isActive ? 'green' : 'red'}>
                            {user.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                    </Grid.Col>
                </Grid>

                <Divider my="md" />

                <Title order={5} c="blue">Lịch sử đặt phòng ({user.reservations?.length || 0})</Title>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Mã Booking</Table.Th>
                            <Table.Th>Ngày nhận (Check-in)</Table.Th>
                            <Table.Th>Ngày trả (Check-out)</Table.Th>
                            <Table.Th>Số khách</Table.Th>
                            <Table.Th>Trạng thái</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {user.reservations && user.reservations.length > 0 ? (
                            user.reservations.map((res) => (
                                <Table.Tr key={res.bookingId}>
                                    <Table.Td fw={600}>{res.bookingCode}</Table.Td>
                                    <Table.Td>{formatDate(res.checkInDate)}</Table.Td>
                                    <Table.Td>{formatDate(res.checkOutDate)}</Table.Td>
                                    <Table.Td>{res.numberOfMembers}</Table.Td>
                                    <Table.Td>
                                        <Badge color={getStatusColor(res.status)} variant="dot">
                                            {res.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                                    <Text c="dimmed">Khách hàng này chưa có đơn đặt phòng nào.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Modal>
    );
}