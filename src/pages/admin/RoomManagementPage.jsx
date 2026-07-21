import {useEffect, useMemo, useState} from 'react';
import {
    Badge,
    Button,
    Divider,
    Group,
    Modal,
    Pagination,
    Paper,
    Select,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
    Title,
    NumberInput,
    Anchor,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {modals} from '@mantine/modals';
import {notifications} from '@mantine/notifications';
import {IconPlus, IconSearch,} from '@tabler/icons-react';
import {roomApi} from '../../apis/admin/roomApi';

const PAGE_SIZE = 7;

const roomStatusOptions = ['Available', 'Dirty', 'Occupied', 'Maintenance', 'Cleaning'];

const statusColorMap = {
    Available: 'green',
    Reserved: 'blue',
    Clean: 'teal',
    Dirty: 'yellow',
    Occupied: 'red',
    Maintenance: 'orange',
    Cleaning: 'cyan',
};

const emptyRoomForm = {
    roomNumber: '',
    roomClassId: '',
    floor: 1,
    status: 'Available',
    description: '',
};

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.message
            || error?.response?.data?.error
            || error?.message
            || fallbackMessage;
}

function RoomFormModal({opened, mode, onClose, onSubmit, initialValues, roomClassOptions}) {
    const form = useForm({
        mode: 'controlled',
        initialValues,
        validate: {
            roomNumber: (value) => (value.trim().length < 1 ? 'Room number is required' : null),
            roomClassId: (value) => (!value ? 'Room class is required' : null),
            status: (value) => (!value ? 'Status is required' : null),
        },
    });

    useEffect(() => {
        if (opened && initialValues) {
            form.setValues(initialValues);
            form.resetDirty(initialValues);
            form.clearErrors();
        }
    }, [opened, initialValues]);

    const roomClassField = form.getInputProps('roomClassId');
    const statusField = form.getInputProps('status');

    return (
            <Modal
                    opened={opened}
                    onClose={onClose}
                    title={mode === 'create' ? 'Add New Room' : 'Edit Room'}
                    centered
                    size="lg"
            >
                <form onSubmit={form.onSubmit(onSubmit)}>
                    <Stack>
                        <TextInput
                                label="Room Number"
                                placeholder="e.g. 101"
                                {...form.getInputProps('roomNumber')}
                        />

                        <Group grow>
                            <Select
                                    searchable
                                    label="Room Class"
                                    placeholder="Select room class"
                                    data={roomClassOptions}
                                    value={roomClassField.value || null}
                                    onChange={(value) => form.setFieldValue('roomClassId', value || '')}
                                    onBlur={roomClassField.onBlur}
                                    error={roomClassField.error}
                            />
                            <NumberInput
                                    label="Floor"
                                    min={1}
                                    max={99}
                                    allowDecimal={false}
                                    {...form.getInputProps('floor')}
                            />
                        </Group>

                        <Select
                                label="Status"
                                data={roomStatusOptions}
                                value={statusField.value || null}
                                onChange={(value) => form.setFieldValue('status', value || '')}
                                onBlur={statusField.onBlur}
                                error={statusField.error}
                        />

                        <Textarea
                                label="Description"
                                placeholder="Optional room note"
                                autosize
                                minRows={2}
                                maxRows={4}
                                {...form.getInputProps('description')}
                        />

                        <Group justify="flex-end">
                            <Button variant="default" onClick={onClose}>Cancel</Button>
                            <Button type="submit">{mode === 'create' ? 'Create room' : 'Save changes'}</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
    );
}

function RoomDetailsModal({opened, room, onClose}) {
    if (!room) {
        return null;
    }

    return (
            <Modal opened={opened} onClose={onClose} title={`Room ${room.roomNumber} Details`} centered size="md">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Room Number</Text>
                        <Text>{room.roomNumber || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Room Class</Text>
                        <Text>{room.roomClassName || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Floor</Text>
                        <Text>{room.floor ?? '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Status</Text>
                        <Badge color={statusColorMap[room.status]} variant="light">{room.status}</Badge>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Rate per Night</Text>
                        <Text>{room.baseRate != null ? `$${Number(room.baseRate).toFixed(0)}` : '-'}</Text>
                    </Group>
                    <div>
                        <Text fw={600} mb={4}>Description</Text>
                        <Text c="dimmed" size="sm">{room.description || '-'}</Text>
                    </div>
                </Stack>
            </Modal>
    );
}

export default function RoomManagementPage() {
    const [rooms, setRooms] = useState([]);
    const [roomClassOptions, setRoomClassOptions] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [classFilter, setClassFilter] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [formOpened, setFormOpened] = useState(false);
    const [detailsOpened, setDetailsOpened] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        let ignore = false;

        roomApi.getRooms()
                .then((roomData) => {
                    if (!ignore) {
                        setRooms(roomData);
                    }
                })
                .catch((error) => {
                    console.error('Error isLoading rooms:', error);
                    notifications.show({
                        color: 'red',
                        message: getApiErrorMessage(error, 'Failed to load rooms from database.'),
                    });
                });

        roomApi.getRoomClasses()
                .then((classData) => {
                    if (!ignore) {
                        setRoomClassOptions(Array.isArray(classData) ? classData : []);
                    }
                })
                .catch((error) => {
                    console.error('Error isLoading room classes:', error);
                    notifications.show({
                        color: 'yellow',
                        message: getApiErrorMessage(error, 'Room classes are temporarily unavailable.'),
                    });
                });

        return () => {
            ignore = true;
        };
    }, []);

    const roomClassNameById = useMemo(() => {
        const map = new Map();
        (Array.isArray(roomClassOptions) ? roomClassOptions : []).forEach((opt) => {
            map.set(String(opt.value), opt.label);
        });
        return map;
    }, [roomClassOptions]);

    const filteredRooms = rooms.filter((room) => {
        const query = searchValue.trim().toLowerCase();
        const matchesQuery = !query
                || room.roomNumber.toLowerCase().includes(query)
                || (room.roomClassName || '').toLowerCase().includes(query)
                || (room.description || '').toLowerCase().includes(query);

        const matchesStatus = !statusFilter || room.status === statusFilter;
        const matchesClass = !classFilter || String(room.roomClassId) === classFilter;

        return matchesQuery && matchesStatus && matchesClass;
    });

    const totalPages = Math.ceil(filteredRooms.length / PAGE_SIZE);
    const pagedRooms = filteredRooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedRoom({...emptyRoomForm});
        setFormOpened(true);
    };

    const openEditModal = (room) => {
        setModalMode('edit');
        setSelectedRoom({
            ...room,
            roomClassId: String(room.roomClassId),
        });
        setFormOpened(true);
    };

    const openDetailsModal = (room) => {
        setSelectedRoom(room);
        setDetailsOpened(true);
    };

    const handleSubmit = (values) => {
        if (modalMode === 'create') {
            roomApi.createRoom(values)
                    .then((created) => {
                        setRooms((prev) => [created, ...prev]);
                        notifications.show({color: 'green', message: 'Room created and saved to database.'});
                        setFormOpened(false);
                    })
                    .catch((error) => {
                        console.error('Error creating room:', error);
                        notifications.show({
                            color: 'red',
                            message: getApiErrorMessage(error, 'Create room failed.'),
                        });
                    });
            return;
        }

        roomApi.updateRoom(selectedRoom.id, values)
                .then((updated) => {
                    setRooms((prev) => prev.map((room) => (
                            room.id === selectedRoom.id
                                    ? {
                                        ...room,
                                        ...updated,
                                        roomClassName: updated.roomClassName || roomClassNameById.get(String(values.roomClassId)) || room.roomClassName,
                                        description: values.description,
                                    }
                                    : room
                    )));
                    notifications.show({
                        color: 'green',
                        message: 'Room updated in database.',
                    });
                    setFormOpened(false);
                })
                .catch((error) => {
                    console.error('Error updating room:', error);
                    notifications.show({
                        color: 'red',
                        message: getApiErrorMessage(error, 'Update room failed.'),
                    });
                });
    };

    const handleDelete = (room) => {
        modals.openConfirmModal({
            title: 'Delete room',
            centered: true,
            children: (
                    <Text size="sm">
                        Delete {room.roomNumber}? This action will also delete it from database.
                    </Text>
            ),
            labels: {confirm: 'Delete', cancel: 'Cancel'},
            confirmProps: {color: 'red'},
            onConfirm: () => {
                roomApi.deleteRoom(room.id)
                        .then(() => {
                            setRooms((prev) => prev.filter((item) => item.id !== room.id));
                            notifications.show({
                                color: 'green',
                                message: 'Room deleted from database.',
                            });
                        })
                        .catch((error) => {
                            console.error('Error deleting room:', error);
                            notifications.show({
                                color: 'red',
                                message: getApiErrorMessage(error, 'Delete room failed.'),
                            });
                        });
            },
        });
    };

    return (
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={1}>Manage Rooms</Title>
                    <Button leftSection={<IconPlus size={16}/>} onClick={openCreateModal}>
                        + Add New Room
                    </Button>
                </Group>

                <Paper withBorder radius="md" p="lg">
                    <Title order={4} mb="md">Room List Management</Title>

                    <Group mb="md" align="flex-end">
                        <TextInput
                                placeholder="Search"
                                leftSection={<IconSearch size={16}/>}
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.currentTarget.value)}
                                style={{flex: 1, minWidth: 200}}
                        />
                        <Select
                                clearable
                                placeholder="Filter by Status"
                                data={roomStatusOptions}
                                value={statusFilter}
                                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                style={{minWidth: 160}}
                        />
                        <Select
                                clearable
                                placeholder="Filter by Type"
                                data={roomClassOptions}
                                value={classFilter}
                                onChange={(v) => { setClassFilter(v); setPage(1); }}
                                style={{minWidth: 160}}
                        />
                    </Group>

                    <Divider mb="md"/>

                    <div style={{overflowX: 'auto'}}>
                        <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" miw={800}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>ROOM #</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>ROOM TYPE</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>FLOOR</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>STATUS</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>RATE PER NIGHT ($)</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>ACTION</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pagedRooms.length > 0 ? pagedRooms.map((room) => (
                                        <Table.Tr key={room.id}>
                                            <Table.Td fw={600}>Room #{room.roomNumber}</Table.Td>
                                            <Table.Td>
                                                <Group gap={4} align="center">
                                                    <span style={{fontSize: 16}}>🛏</span>
                                                    <Text size="sm">{room.roomClassName || '-'}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="blue" fw={600}>{room.floor ?? '-'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={statusColorMap[room.status] || 'gray'} variant="filled" size="sm" radius="sm">
                                                    {room.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">${room.baseRate != null ? Number(room.baseRate).toFixed(0) : '—'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} wrap="nowrap">
                                                    <Anchor
                                                            size="sm"
                                                            c="blue"
                                                            fw={500}
                                                            onClick={() => openDetailsModal(room)}
                                                            style={{cursor: 'pointer'}}
                                                    >
                                                        View/Edit
                                                    </Anchor>
                                                    <Text size="sm" c="dimmed">|</Text>
                                                    <Anchor
                                                            size="sm"
                                                            c="red"
                                                            fw={500}
                                                            onClick={() => handleDelete(room)}
                                                            style={{cursor: 'pointer'}}
                                                    >
                                                        Delete
                                                    </Anchor>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                )) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={6}>
                                                <Text ta="center" py="lg" c="dimmed">
                                                    No rooms matched the current filters.
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <Group justify="flex-end" mt="md">
                            <Pagination
                                value={page}
                                onChange={setPage}
                                total={totalPages}
                                size="sm"
                                withEdges
                            />
                        </Group>
                    )}
                </Paper>

                <RoomFormModal
                        key={selectedRoom?.id ?? 'new'}
                        opened={formOpened}
                        mode={modalMode}
                        initialValues={selectedRoom || emptyRoomForm}
                        onClose={() => setFormOpened(false)}
                        onSubmit={handleSubmit}
                        roomClassOptions={roomClassOptions}
                />

                <RoomDetailsModal
                        opened={detailsOpened}
                        room={selectedRoom && selectedRoom.id ? selectedRoom : null}
                        onClose={() => {
                            setDetailsOpened(false);
                            // Open edit if user clicks View/Edit
                        }}
                />
            </Stack>
    );
}
