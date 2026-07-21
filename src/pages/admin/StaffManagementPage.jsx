import { useState, useEffect } from 'react';
import {
    Title, Paper, Group, Button, TextInput, Select,
    Table, ActionIcon, Badge, Pagination, Text, LoadingOverlay, Grid
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEye, IconEdit, IconLock, IconLockOpen, IconSearch } from '@tabler/icons-react';

import { staffApi } from '../../apis/admin/staffApi';
import { StaffCreateModal } from '../../components/admin/staff/StaffCreateModal';
import { StaffDetailModal } from '../../components/admin/staff/StaffDetailModal';
import { StaffEditModal } from '../../components/admin/staff/StaffEditModal';

export default function StaffManagementPage() {
    const PAGE_SIZE = 6;
    const [staffs, setStaffs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [filterDept, setFilterDept] = useState(null);
    const [filterRole, setFilterRole] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);
    const [filterIsActive, setFilterIsActive] = useState(null);

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const fetchStaffs = async () => {
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: PAGE_SIZE,
                department: filterDept || undefined,
                role: filterRole || undefined,
                status: filterStatus || undefined,
                isActive: filterIsActive !== null ? filterIsActive === 'true' : undefined,
            };

            const res = await staffApi.getStaffs(params);
            const keyword = String(appliedSearch || '').trim().toLowerCase();
            const filtered = (res.content || []).filter((staff) => {
                if (!keyword) return true;
                return [
                    String(staff.fullName || ''),
                    String(staff.email || ''),
                    String(staff.phoneNumber || ''),
                    String(staff.id || ''),
                ].some((field) => field.toLowerCase().includes(keyword));
            });

            setStaffs(filtered);
            setTotalPages(keyword ? 1 : (res.totalPages || 1));
            setTotalElements(keyword ? filtered.length : (res.totalElements || 0));
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Unable to load staff list', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, appliedSearch, filterDept, filterStatus, filterIsActive]);

    const handleSearch = () => {
        setAppliedSearch(searchQuery);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setAppliedSearch('');
        setFilterDept(null);
        setFilterRole(null);
        setFilterStatus(null);
        setFilterIsActive(null);
        setPage(1);
    };

    // ---- TABLE ACTION HANDLERS ----
    const handleViewDetail = (staff) => {
        setSelectedStaff(staff);
        openDetail();
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        openEdit();
    };

    const handleToggleStatus = (staff) => {
        const nextActive = !staff.isActive;
        modals.openConfirmModal({
            title: nextActive ? 'Confirm unlock' : 'Confirm disable account',
            children: <Text size="sm">Are you sure you want to {nextActive ? 'unlock' : 'disable'} the account for <b>{staff.email}</b>?</Text>,
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            confirmProps: { color: nextActive ? 'green' : 'red' },
            onConfirm: async () => {
                try {
                    await staffApi.updateStaffStatus(staff.id, nextActive);
                    notifications.show({ title: 'Success', message: nextActive ? 'Staff account unlocked' : 'Staff account disabled', color: 'green' });
                    fetchStaffs();
                } catch (error) {
                    notifications.show({ title: 'Error', message: 'Action failed', color: 'red' });
                }
            },
        });
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="sm">
                <div>
                    <Title order={1}>Staff Management</Title>
                    <Text size="md" c="dimmed">Staff Directory</Text>
                </div>
            </Group>

            <Paper shadow="sm" p="md" mb="xl" radius="md" withBorder>
                <Grid mb="md" align="flex-end">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <TextInput
                            label="Filter by"
                            placeholder="Search by Name, Email, Phone..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                            label="Department"
                            placeholder="All"
                            data={[
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                                { value: 'RECEPTION', label: 'Front Office' },
                                { value: 'F&B', label: 'F&B' },
                                { value: 'SALES_MARKETING', label: 'Sales & Marketing' },
                                { value: 'HR', label: 'HR' },
                                { value: 'ENGINEERING', label: 'Engineering' },
                            ]}
                            value={filterDept}
                            onChange={(val) => { setFilterDept(val); setPage(1); }}
                            clearable
                            withinPortal
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                            label="Role"
                            placeholder="All"
                            data={[
                                { value: 'ADMIN', label: 'Admin' },
                                { value: 'RECEPTIONIST', label: 'Receptionist' },
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                            ]}
                            value={filterRole}
                            onChange={(val) => { setFilterRole(val); setPage(1); }}
                            clearable
                            withinPortal
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                            label="Status"
                            placeholder="All"
                            data={[
                                { value: 'true', label: 'Active' },
                                { value: 'false', label: 'Inactive' },
                            ]}
                            value={filterIsActive}
                            onChange={(val) => { setFilterIsActive(val); setPage(1); }}
                            clearable
                            withinPortal
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Button fullWidth onClick={handleSearch}>
                            Filter
                        </Button>
                    </Grid.Col>
                </Grid>

                {/* --- STAFF DATA TABLE --- */}
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Phone</Table.Th>
                            <Table.Th>Department</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Account</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Action</Table.Th>
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
                                            <ActionIcon variant="subtle" color="gray" onClick={() => handleEditStaff(staff)} title="Edit staff">
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                color={staff.isActive ? 'red' : 'green'}
                                                onClick={() => handleToggleStatus(staff)}
                                                title={staff.isActive ? 'Disable account' : 'Unlock account'}
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
                                    <Text c="dimmed">No staff found for the current filters</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                {/* --- PAGINATION --- */}
                {staffs.length > 0 && (
                    <Group justify="space-between" align="center" mt="xl" spacing="md">
                        <Group justify="center" align="center" spacing="md">
                            <Button
                                variant="outline"
                                size="xs"
                                disabled={page <= 1}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            >
                                Previous
                            </Button>
                            <Pagination
                                total={totalPages || 1}
                                value={page}
                                onChange={setPage}
                                color="blue"
                                withEdges
                            />
                            <Button
                                variant="outline"
                                size="xs"
                                disabled={page >= (totalPages || 1)}
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || 1))}
                            >
                                Next
                            </Button>
                        </Group>
                        <Text size="sm" c="dimmed">
                            Showing {staffs.length > 0 ? `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, totalElements)}` : '0'} of {totalElements} staff
                        </Text>
                    </Group>
                )}
            </Paper>

            {/* --- MODALS --- */}
            <StaffCreateModal
                opened={createOpened}
                onClose={closeCreate}
                onSuccess={fetchStaffs}
            />

            <StaffEditModal
                opened={editOpened}
                onClose={closeEdit}
                staff={selectedStaff}
                onSubmit={async (values) => {
                    if (!selectedStaff) return;
                    try {
                        await staffApi.updateStaff(selectedStaff.id, values);
                        notifications.show({ title: 'Success', message: 'Staff updated successfully', color: 'green' });
                        fetchStaffs();
                    } catch (error) {
                        notifications.show({ title: 'Error', message: 'Failed to update staff', color: 'red' });
                    }
                }}
            />

            <StaffDetailModal
                opened={detailOpened}
                onClose={closeDetail}
                staff={selectedStaff}
            />
        </div>
    );
}
