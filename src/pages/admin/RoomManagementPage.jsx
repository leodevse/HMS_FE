import {useEffect, useMemo, useState} from 'react';
import {
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    Modal,
    Paper,
    ScrollArea,
    Select,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {modals} from '@mantine/modals';
import {notifications} from '@mantine/notifications';
import {IconEdit, IconEye, IconPlus, IconSearch, IconTrash,} from '@tabler/icons-react';
import {roomApi} from '../../apis/admin/roomApi';

const roomStatusOptions = ['Available', 'Dirty', 'Occupied'];

const statusColorMap = {
    Available: 'green',
    Reserved: 'blue',
    Clean: 'teal',
    Dirty: 'yellow',
    Occupied: 'red',
    Maintenance: 'orange',
};

const emptyRoomForm = {
    roomNumber: '',
    roomClassId: '',
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
            <Modal opened={opened} onClose={onClose} title={room.roomNumber} centered size="md">
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Room Class</Text>
                        <Text>{room.roomClassName || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Status</Text>
                        <Badge color={statusColorMap[room.status]} variant="light">{room.status}</Badge>
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
                        message: getApiErrorMessage(error, 'Room classes are temporarily unavailable. Please check Room Types setup.'),
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

    const roomStats = {
        total: rooms.length,
        available: rooms.filter((room) => room.status === 'Available').length,
        occupied: rooms.filter((room) => room.status === 'Occupied').length,
        maintenance: rooms.filter((room) => room.status === 'Maintenance').length,
    };

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
                    <div>
                        <Title order={1}>Manage Rooms</Title>
                        <Text c="dimmed" mt={4}>Room management synced with database schema.</Text>
                    </div>

                    <Button leftSection={<IconPlus size={16}/>} onClick={openCreateModal}>
                        Add New Room
                    </Button>
                </Group>

                <Group>
                    <Badge size="lg" variant="light" color="blue">Total: {roomStats.total}</Badge>
                    <Badge size="lg" variant="light" color="green">Available: {roomStats.available}</Badge>
                    <Badge size="lg" variant="light" color="red">Occupied: {roomStats.occupied}</Badge>
                    <Badge size="lg" variant="light" color="orange">Maintenance: {roomStats.maintenance}</Badge>
                </Group>

                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="lg">
                        <div>
                            <Title order={2}>Room List</Title>
                            <Text c="dimmed" mt={4}>Search and filter by room number, class, status.</Text>
                        </div>

                        <Group align="end" grow>
                            <TextInput
                                    label="Search"
                                    placeholder="Search room number, class or description"
                                    leftSection={<IconSearch size={16}/>}
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.currentTarget.value)}
                            />
                            <Select
                                    clearable
                                    label="Filter by Status"
                                    placeholder="All statuses"
                                    data={roomStatusOptions}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                            />
                            <Select
                                    clearable
                                    label="Filter by Room Class"
                                    placeholder="All room classes"
                                    data={roomClassOptions}
                                    value={classFilter}
                                    onChange={setClassFilter}
                            />
                        </Group>

                        <Divider/>

                        <ScrollArea>
                            <Table highlightOnHover verticalSpacing="md" miw={900}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Room</Table.Th>
                                        <Table.Th>Room Class</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Description</Table.Th>
                                        <Table.Th>Action</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredRooms.length > 0 ? filteredRooms.map((room) => (
                                            <Table.Tr key={room.id}>
                                                <Table.Td fw={600}>{room.roomNumber}</Table.Td>
                                                <Table.Td>{room.roomClassName || '-'}</Table.Td>
                                                <Table.Td>
                                                    <Badge color={statusColorMap[room.status]} variant="light">
                                                        {room.status}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td maw={320}>
                                                    <Text size="sm" lineClamp={2}>{room.description || '-'}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" wrap="nowrap">
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="blue"
                                                                onClick={() => openDetailsModal(room)}
                                                                aria-label={`View ${room.roomNumber}`}
                                                        >
                                                            <IconEye size={18}/>
                                                        </ActionIcon>
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="dark"
                                                                onClick={() => openEditModal(room)}
                                                                aria-label={`Edit ${room.roomNumber}`}
                                                        >
                                                            <IconEdit size={18}/>
                                                        </ActionIcon>
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="red"
                                                                onClick={() => handleDelete(room)}
                                                                aria-label={`Delete ${room.roomNumber}`}
                                                        >
                                                            <IconTrash size={18}/>
                                                        </ActionIcon>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                    )) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={5}>
                                                    <Text ta="center" py="lg" c="dimmed">
                                                        No rooms matched the current filters.
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Stack>
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
                        onClose={() => setDetailsOpened(false)}
                />
            </Stack>
    );
}
