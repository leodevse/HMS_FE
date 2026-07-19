import { useState, useEffect } from 'react';
import {
    Title, Paper, Group, TextInput, Select, Button,
    Table, Badge, Pagination, Text, LoadingOverlay, Grid, Switch, ActionIcon
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAt, IconFilter, IconEye } from '@tabler/icons-react';
import { modals } from '@mantine/modals';

import { userApi } from '../../apis/admin/userApi';
import { UserDetailModal } from '../../components/admin/user/UserDetailModal';

export default function UserManagementPage() {
    // ---- STATES ----
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // ---- MODALS ----
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // ---- FILTERS ----
    const [searchEmail, setSearchEmail] = useState('');
    const [filterIsActive, setFilterIsActive] = useState(null);
    const [debouncedEmail] = useDebouncedValue(searchEmail, 500);

    // ---- FETCH DỮ LIỆU ----
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: 6,
                email: debouncedEmail || undefined,
                isActive: filterIsActive !== null ? filterIsActive === 'true' : undefined
            };

            const res = await userApi.getCustomersPage(params);

            setUsers(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Lỗi', message: 'Không thể tải danh sách người dùng', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedEmail, filterIsActive]);

    const handleClearFilters = () => {
        setSearchEmail('');
        setFilterIsActive(null);
        setPage(1);
    };

    // ---- ACTIONS ----
    const handleViewDetail = (user) => {
        setSelectedUser(user);
        openDetail();
    };

    const handleToggleStatus = (user) => {
        const newStatus = !user.isActive;
        const actionText = newStatus ? 'mở khóa' : 'khóa';

        modals.openConfirmModal({
            title: `Xác nhận ${actionText} tài khoản`,
            children: <Text size="sm">Bạn có chắc chắn muốn {actionText} tài khoản của <b>{user.email}</b> không?</Text>,
            labels: { confirm: 'Xác nhận', cancel: 'Hủy' },
            confirmProps: { color: newStatus ? 'green' : 'red' },
            onConfirm: async () => {
                try {
                    await userApi.updateUserStatus(user.id, newStatus);
                    notifications.show({ title: 'Thành công', message: `Đã ${actionText} tài khoản!`, color: 'green' });
                    fetchUsers();
                } catch (error) {
                    notifications.show({ title: 'Lỗi', message: 'Cập nhật trạng thái thất bại', color: 'red' });
                }
            },
        });
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="lg">
                <Title order={2}>Quản lý Người dùng (Khách hàng)</Title>
            </Group>

            <Paper shadow="sm" p="md" mb="xl" radius="md" withBorder>
                {/* --- BỘ LỌC TÌM KIẾM --- */}
                <Grid mb="md" align="flex-end">
                    <Grid.Col span={{ base: 12, sm: 5 }}>
                        <TextInput
                            label="Email"
                            placeholder="Tìm kiếm theo email..."
                            leftSection={<IconAt size={16} />}
                            value={searchEmail}
                            onChange={(e) => { setSearchEmail(e.currentTarget.value); setPage(1); }}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Select
                            label="Trạng thái tài khoản"
                            placeholder="Tất cả"
                            leftSection={<IconFilter size={16} />}
                            data={[
                                { value: 'true', label: 'Đang hoạt động (Active)' },
                                { value: 'false', label: 'Bị khóa (Disabled)' },
                            ]}
                            value={filterIsActive}
                            onChange={(val) => { setFilterIsActive(val); setPage(1); }}
                            clearable
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 3 }}>
                        <Button variant="light" color="gray" fullWidth onClick={handleClearFilters}>
                            Xóa bộ lọc
                        </Button>
                    </Grid.Col>
                </Grid>

                <Group justify="flex-end" mb="sm">
                    <Text size="sm" c="dimmed" fw={500}>Tìm thấy: {totalElements} người dùng</Text>
                </Group>

                {/* --- BẢNG DỮ LIỆU --- */}
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Họ và tên</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Số điện thoại</Table.Th>
                            <Table.Th>Vai trò</Table.Th>
                            <Table.Th>Trạng thái</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Thao tác</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <Table.Tr key={user.id}>
                                    <Table.Td>{user.id}</Table.Td>
                                    <Table.Td fw={500}>{user.fullName || 'Chưa cập nhật'}</Table.Td>
                                    <Table.Td>{user.email}</Table.Td>
                                    <Table.Td>{user.phoneNumber || 'Chưa cập nhật'}</Table.Td>
                                    <Table.Td>
                                        <Badge color="violet" variant="light">{user.role}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={user.isActive ? 'green' : 'red'} variant="dot">
                                            {user.isActive ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Group justify="center" gap="sm">
                                            <ActionIcon variant="subtle" color="blue" onClick={() => handleViewDetail(user)}>
                                                <IconEye size={20} />
                                            </ActionIcon>
                                            <Switch
                                                checked={user.isActive}
                                                color="green"
                                                onChange={() => handleToggleStatus(user)}
                                                style={{ cursor: 'pointer' }}
                                                title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                            />
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Text c="dimmed">Không tìm thấy người dùng nào phù hợp</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                {/* --- PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <Group justify="center" mt="xl">
                        <Pagination total={totalPages} value={page} onChange={setPage} color="blue" withEdges />
                    </Group>
                )}
            </Paper>

            {/* --- MODAL CHI TIẾT --- */}
            <UserDetailModal
                opened={detailOpened}
                onClose={closeDetail}
                user={selectedUser}
            />
        </div>
    );
}