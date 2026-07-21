import { useState, useEffect } from 'react';
import {
    Title, Paper, Group, TextInput, Select, Button,
    Table, Badge, Pagination, Text, LoadingOverlay, Grid, Switch, ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAt, IconEye, IconEdit } from '@tabler/icons-react';
import { modals } from '@mantine/modals';

import { userApi } from '../../apis/admin/userApi';
import { UserDetailModal } from '../../components/admin/user/UserDetailModal';
import { UserEditModal } from '../../components/admin/user/UserEditModal';

export default function UserManagementPage() {
    // ---- STATES ----
    const PAGE_SIZE = 6;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // ---- MODALS ----
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // ---- FILTERS ----
    const [filterField, setFilterField] = useState('email');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedField, setAppliedField] = useState('email');
    const [filterRole, setFilterRole] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);

    // ---- FETCH DATA ----
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: PAGE_SIZE,
                role: filterRole || undefined,
                isActive: filterStatus !== null ? filterStatus === 'true' : undefined,
            };

            if (appliedField === 'email') {
                params.email = appliedSearch || undefined;
            } else if (appliedField === 'name') {
                params.name = appliedSearch || undefined;
            } else if (appliedField === 'id') {
                params.id = appliedSearch || undefined;
            }

            const res = await userApi.getUsersPage(params);
            setUsers(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Unable to load user list', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, appliedSearch, appliedField, filterRole, filterStatus]);

    const handleSearch = () => {
        setAppliedField(filterField);
        setAppliedSearch(searchQuery);
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilterField('email');
        setSearchQuery('');
        setAppliedSearch('');
        setAppliedField('email');
        setFilterRole(null);
        setFilterStatus(null);
        setPage(1);
    };

    // ---- ACTIONS ----
    const handleViewDetail = (user) => {
        setSelectedUser(user);
        openDetail();
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        openEdit();
    };

    const handleToggleStatus = (user) => {
        const newStatus = !user.isActive;
        const actionText = newStatus ? 'unlock' : 'disable';

        modals.openConfirmModal({
            title: `Confirm ${actionText} account`,
            children: <Text size="sm">Are you sure you want to {actionText} the account of <b>{user.email}</b>?</Text>,
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            confirmProps: { color: newStatus ? 'green' : 'red' },
            onConfirm: async () => {
                try {
                    await userApi.updateUserStatus(user.id, newStatus);
                    notifications.show({ title: 'Success', message: `Account ${actionText}d!`, color: 'green' });
                    fetchUsers();
                } catch (error) {
                    notifications.show({ title: 'Error', message: 'Failed to update account status', color: 'red' });
                }
            },
        });
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="sm">
                <div>
                    <Title order={1}>User Management</Title>
                    <Text size="md" c="dimmed">User Directory</Text>
                </div>
            </Group>

            <Paper shadow="sm" p="md" mb="xl" radius="md" withBorder>
                {/* --- SEARCH FILTER --- */}
                <Grid mb="md" align="flex-end">
                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                            label="Filter by"
                            data={[
                                { value: 'id', label: 'ID' },
                                { value: 'name', label: 'Name' },
                                { value: 'email', label: 'Email' },
                            ]}
                            value={filterField}
                            onChange={(val) => setFilterField(val)}
                            withinPortal
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <TextInput
                            placeholder="Search keyword..."
                            leftSection={<IconAt size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                            label="Role"
                            placeholder="All"
                            data={[
                                { value: 'ADMIN', label: 'Admin' },
                                { value: 'MANAGER', label: 'Manager' },
                                { value: 'STAFF', label: 'Staff' },
                                { value: 'RECEPTIONIST', label: 'Receptionist' },
                                { value: 'CUSTOMER', label: 'Customer' },
                            ]}
                            value={filterRole}
                            onChange={(val) => setFilterRole(val)}
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
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val)}
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

                <Group position="apart" mb="sm">
                    <Text size="sm" c="dimmed" fw={500}>
                        Showing {users.length > 0 ? `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, totalElements)}` : '0'} of {totalElements} users
                    </Text>
                </Group>

                {/* --- USER TABLE --- */}
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>No.</Table.Th>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Phone</Table.Th>
                            <Table.Th>Role</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {users.length > 0 ? (
                            users.map((user, index) => (
                                <Table.Tr key={user.id}>
                                    <Table.Td>{(page - 1) * PAGE_SIZE + index + 1}</Table.Td>
                                    <Table.Td>{user.id}</Table.Td>
                                    <Table.Td fw={500}>{user.fullName || 'Not updated'}</Table.Td>
                                    <Table.Td>{user.email}</Table.Td>
                                    <Table.Td>{user.phoneNumber || 'Not updated'}</Table.Td>
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
                                            <ActionIcon variant="subtle" color="gray" onClick={() => handleEditUser(user)}>
                                                <IconEdit size={20} />
                                            </ActionIcon>
                                            <Switch
                                                checked={user.isActive}
                                                color="green"
                                                onChange={() => handleToggleStatus(user)}
                                                style={{ cursor: 'pointer' }}
                                                title={user.isActive ? "Disable account" : "Unlock account"}
                                            />
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Text c="dimmed">No users found</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>

                {/* --- PAGINATION --- */}
                {users.length > 0 && (
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
                            <Pagination total={totalPages || 1} value={page} onChange={setPage} color="blue" withEdges />
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
                            Showing {users.length > 0 ? `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(page * PAGE_SIZE, totalElements)}` : '0'} of {totalElements} users
                        </Text>
                    </Group>
                )}
            </Paper>

            {/* --- MODAL CHI TIẾT --- */}
            <UserEditModal
                opened={editOpened}
                onClose={closeEdit}
                user={selectedUser}
                onSubmit={async (values) => {
                    try {
                        await userApi.updateUser(selectedUser.id, {
                            fullName: values.fullName,
                            phoneNumber: values.phoneNumber,
                            identityCard: values.identityCard,
                            active: values.isActive,
                        });
                        notifications.show({ title: 'Success', message: 'User updated successfully', color: 'green' });
                        fetchUsers();
                    } catch (error) {
                        notifications.show({ title: 'Error', message: 'Failed to update user', color: 'red' });
                    }
                }}
            />
            <UserDetailModal
                opened={detailOpened}
                onClose={closeDetail}
                user={selectedUser}
            />
        </div>
    );
}