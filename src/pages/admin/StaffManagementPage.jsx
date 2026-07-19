import { useState, useEffect } from 'react';
import {
    Title, Paper, Group, Button, TextInput, Select,
    Table, ActionIcon, Badge, Pagination, Text, LoadingOverlay, Grid
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEye, IconLock, IconLockOpen, IconSearch, IconFilter, IconPhone, IconAt } from '@tabler/icons-react';

import { staffApi } from '../../apis/admin/staffApi';
import { StaffCreateModal } from '../../components/admin/staff/StaffCreateModal';
import { StaffDetailModal } from '../../components/admin/staff/StaffDetailModal';

export default function StaffManagementPage() {
    // ---- STATES CHO DATA VÀ PHÂN TRANG ----
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // ---- STATES CHO BỘ LỌC (FILTERS) ----
    const [searchName, setSearchName] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [filterDept, setFilterDept] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);
    const [filterIsActive, setFilterIsActive] = useState(null); // 'true' hoặc 'false'

    // Debounce cho các trường nhập tay (giảm tải gọi API liên tục)
    const [debouncedName] = useDebouncedValue(searchName, 500);
    const [debouncedEmail] = useDebouncedValue(searchEmail, 500);
    const [debouncedPhone] = useDebouncedValue(searchPhone, 500);

    // ---- STATES CHO MODALS ----
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    // ---- FETCH DỮ LIỆU TỪ API ----
    const fetchStaffs = async () => {
        setLoading(true);
        try {
            // Chuẩn bị payload tương ứng với API và Specification ở backend
            const params = {
                page: page - 1, // backend dùng index 0
                size: 6,
                name: debouncedName || undefined,
                email: debouncedEmail || undefined,
                phoneNumber: debouncedPhone || undefined,
                department: filterDept || undefined,
                status: filterStatus || undefined,
                // Chuyển đổi từ chuỗi 'true'/'false' của Select sang boolean thực sự
                isActive: filterIsActive !== null ? filterIsActive === 'true' : undefined
            };

            const res = await staffApi.getStaffs(params);

            setStaffs(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Lỗi', message: 'Không thể tải danh sách nhân viên', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // Gọi API mỗi khi page hoặc bất kỳ filter nào thay đổi
    useEffect(() => {
        fetchStaffs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedName, debouncedEmail, debouncedPhone, filterDept, filterStatus, filterIsActive]);

    // Xóa bộ lọc
    const handleClearFilters = () => {
        setSearchName('');
        setSearchEmail('');
        setSearchPhone('');
        setFilterDept(null);
        setFilterStatus(null);
        setFilterIsActive(null);
        setPage(1);
    };

    // ---- HANDLERS CHO ACTION BẢNG ----
    const handleViewDetail = (staff) => {
        setSelectedStaff(staff);
        openDetail();
    };

    const handleToggleStatus = (staff) => {
        const nextActive = !staff.isActive;
        modals.openConfirmModal({
            title: nextActive ? 'Xác nhận mở khóa' : 'Xác nhận khóa tài khoản',
            children: <Text size="sm">Bạn có chắc chắn muốn {nextActive ? 'mở khóa' : 'khóa'} tài khoản <b>{staff.email}</b> không?</Text>,
            labels: { confirm: 'Xác nhận', cancel: 'Hủy' },
            confirmProps: { color: nextActive ? 'green' : 'red' },
            onConfirm: async () => {
                try {
                    await staffApi.updateStaffStatus(staff.id, nextActive);
                    notifications.show({ title: 'Thành công', message: nextActive ? 'Đã mở khóa nhân viên' : 'Đã khóa nhân viên', color: 'green' });
                    fetchStaffs();
                } catch (error) {
                    notifications.show({ title: 'Lỗi', message: 'Thao tác thất bại', color: 'red' });
                }
            },
        });
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            {/* Header */}
            <Group justify="space-between" mb="lg">
                <Title order={2}>Quản lý nhân viên</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Tạo tài khoản
                </Button>
            </Group>

            <Paper shadow="sm" p="md" mb="xl" radius="md" withBorder>
                {/* --- KHU VỰC BỘ LỌC TÌM KIẾM --- */}
                <Grid mb="md" align="flex-end">
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Tên nhân viên"
                            placeholder="Nhập tên..."
                            leftSection={<IconSearch size={16} />}
                            value={searchName}
                            onChange={(e) => { setSearchName(e.currentTarget.value); setPage(1); }}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Email"
                            placeholder="Nhập email..."
                            leftSection={<IconAt size={16} />}
                            value={searchEmail}
                            onChange={(e) => { setSearchEmail(e.currentTarget.value); setPage(1); }}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                        <TextInput
                            label="Số điện thoại"
                            placeholder="Nhập SĐT..."
                            leftSection={<IconPhone size={16} />}
                            value={searchPhone}
                            onChange={(e) => { setSearchPhone(e.currentTarget.value); setPage(1); }}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Select
                            label="Bộ phận"
                            placeholder="Tất cả"
                            leftSection={<IconFilter size={16} />}
                            data={[
                                { value: 'HOUSEKEEPING', label: 'Buồng phòng' },
                                { value: 'RECEPTION', label: 'Lễ tân' },
                                { value: 'MANAGER', label: 'Quản lý' },
                            ]}
                            value={filterDept}
                            onChange={(val) => { setFilterDept(val); setPage(1); }}
                            clearable
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Select
                            label="Trạng thái làm việc"
                            placeholder="Tất cả"
                            data={[
                                { value: 'AVAILABLE', label: 'Sẵn sàng' },
                                { value: 'BUSY', label: 'Đang bận' },
                                { value: 'ON_LEAVE', label: 'Nghỉ phép' },
                            ]}
                            value={filterStatus}
                            onChange={(val) => { setFilterStatus(val); setPage(1); }}
                            clearable
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Select
                            label="Trạng thái tài khoản"
                            placeholder="Tất cả"
                            data={[
                                { value: 'true', label: 'Đang hoạt động (Active)' },
                                { value: 'false', label: 'Bị khóa (Disabled)' },
                            ]}
                            value={filterIsActive}
                            onChange={(val) => { setFilterIsActive(val); setPage(1); }}
                            clearable
                        />
                    </Grid.Col>

                    {/* Nút Clear Filters */}
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Button variant="light" color="gray" fullWidth onClick={handleClearFilters}>
                            Xóa bộ lọc
                        </Button>
                    </Grid.Col>
                </Grid>

                <Group justify="flex-end" mb="sm">
                    <Text size="sm" c="dimmed" fw={500}>Tìm thấy: {totalElements} nhân viên</Text>
                </Group>

                {/* --- BẢNG HIỂN THỊ DỮ LIỆU --- */}
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Họ và tên</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>SĐT</Table.Th>
                            <Table.Th>Bộ phận</Table.Th>
                            <Table.Th>Làm việc</Table.Th>
                            <Table.Th>Tài khoản</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Thao tác</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {staffs.length > 0 ? (
                            staffs.map((staff) => (
                                <Table.Tr key={staff.id}>
                                    <Table.Td>{staff.id}</Table.Td>
                                    <Table.Td fw={500}>{staff.fullName}</Table.Td>
                                    <Table.Td>{staff.email}</Table.Td>
                                    <Table.Td>{staff.phoneNumber}</Table.Td>
                                    <Table.Td>
                                        <Badge color="blue" variant="light">{staff.department}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={staff.status === 'AVAILABLE' ? 'green' : staff.status === 'BUSY' ? 'orange' : 'gray'}>
                                            {staff.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={staff.isActive ? 'green' : 'red'} variant="dot">
                                            {staff.isActive ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Group justify="center" gap="xs">
                                            <ActionIcon variant="subtle" color="blue" onClick={() => handleViewDetail(staff)}>
                                                <IconEye size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                color={staff.isActive ? 'red' : 'green'}
                                                onClick={() => handleToggleStatus(staff)}
                                                title={staff.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                            >
                                                {staff.isActive ? <IconLock size={18} /> : <IconLockOpen size={18} />}
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Text c="dimmed">Không tìm thấy nhân viên nào phù hợp với bộ lọc</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                {/* --- PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <Group justify="center" mt="xl">
                        <Pagination
                            total={totalPages}
                            value={page}
                            onChange={setPage}
                            color="blue"
                            withEdges
                        />
                    </Group>
                )}
            </Paper>

            {/* --- MODALS --- */}
            <StaffCreateModal
                opened={createOpened}
                onClose={closeCreate}
                onSuccess={fetchStaffs}
            />

            <StaffDetailModal
                opened={detailOpened}
                onClose={closeDetail}
                staff={selectedStaff}
            />
        </div>
    );
}
