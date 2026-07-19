import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Button,
    Group,
    Modal,
    NumberInput,
    Paper,
    ScrollArea,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {modals} from '@mantine/modals';
import {notifications} from '@mantine/notifications';
import {IconEdit, IconEye, IconPlus, IconSearch, IconTrash,} from '@tabler/icons-react';
import {roomTypeApi} from '../../apis/admin/roomTypeApi';

const emptyRoomType = {
    name: '',
    standardOccupancy: 1,
    maxOccupancy: 2,
    baseRate: 90,
    extraPersonFee: 0,
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

function formatPrice(value) {
    return `${currencyFormatter.format(Number(value) || 0)} đ`;
}

function getApiErrorMessage(error, fallbackMessage) {
    return error?.response?.data?.message
            || error?.response?.data?.error
            || error?.message
            || fallbackMessage;
}

function RoomTypeFormModal({opened, mode, initialValues, onClose, onSubmit}) {
    const form = useForm({
        mode: 'controlled',
        initialValues,
        validate: {
            name: (value) => (value.trim().length < 2 ? 'Type name is required' : null),
            standardOccupancy: (value) => (value < 1 ? 'Standard occupancy must be at least 1' : null),
            maxOccupancy: (value, values) => (
                    value < values.standardOccupancy ? 'Max occupancy must be greater than or equal to standard occupancy' : null
            ),
            baseRate: (value) => (value <= 0 ? 'Base rate must be greater than 0' : null),
            extraPersonFee: (value) => (value < 0 ? 'Extra person fee cannot be negative' : null),
        },
    });

    useEffect(() => {
        if (opened && initialValues) {
            form.setValues(initialValues);
            form.resetDirty(initialValues);
            form.clearErrors();
        }
    }, [opened, initialValues]);

    return (
            <Modal
                    opened={opened}
                    onClose={onClose}
                    title={mode === 'create' ? 'Add New Room Type' : 'Edit Room Type'}
                    centered
                    size="lg"
            >
                <form onSubmit={form.onSubmit(onSubmit)}>
                    <Stack>
                        <TextInput
                                label="Type Name"
                                placeholder="Deluxe"
                                {...form.getInputProps('name')}
                        />

                        <Group grow align="start">
                            <NumberInput
                                    label="Standard Occupancy"
                                    min={1}
                                    allowDecimal={false}
                                    {...form.getInputProps('standardOccupancy')}
                            />
                            <NumberInput
                                    label="Max Occupancy"
                                    min={1}
                                    allowDecimal={false}
                                    {...form.getInputProps('maxOccupancy')}
                            />
                            <NumberInput
                                    label="Base Rate per Night (đ)"
                                    min={1}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    thousandSeparator=","
                                    {...form.getInputProps('baseRate')}
                            />
                        </Group>

                        <NumberInput
                                label="Extra Person Fee (đ)"
                                min={0}
                                decimalScale={2}
                                fixedDecimalScale
                                thousandSeparator=","
                                {...form.getInputProps('extraPersonFee')}
                        />

                        <Group justify="flex-end">
                            <Button variant="default" onClick={onClose}>Cancel</Button>
                            <Button type="submit">{mode === 'create' ? 'Create room type' : 'Save changes'}</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
    );
}

function RoomTypeDetailsModal({opened, roomType, onClose}) {
    if (!roomType) {
        return null;
    }

    return (
            <Modal opened={opened} onClose={onClose} title={roomType.name} centered>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Standard Occupancy</Text>
                        <Text>{roomType.standardOccupancy}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Max Occupancy</Text>
                        <Text>{roomType.maxOccupancy}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Base Rate</Text>
                        <Text>{formatPrice(roomType.baseRate)}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Extra Person Fee</Text>
                        <Text>{formatPrice(roomType.extraPersonFee)}</Text>
                    </Group>
                </Stack>
            </Modal>
    );
}

export default function RoomTypesPage() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [formOpened, setFormOpened] = useState(false);
    const [detailsOpened, setDetailsOpened] = useState(false);

    useEffect(() => {
        let ignore = false;

        roomTypeApi.getRoomTypes()
                .then((data) => {
                    if (!ignore) {
                        setRoomTypes(data);
                    }
                })
                .catch((error) => {
                    console.error('Error isLoading room types:', error);
                    notifications.show({
                        color: 'red',
                        message: getApiErrorMessage(error, 'Failed to load room types from database.'),
                    });
                });

        return () => {
            ignore = true;
        };
    }, []);

    const filteredRoomTypes = roomTypes.filter((roomType) => {
        const query = searchValue.trim().toLowerCase();
        if (!query) {
            return true;
        }

        return roomType.name.toLowerCase().includes(query);
    });

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedRoomType(emptyRoomType);
        setFormOpened(true);
    };

    const openEditModal = (roomType) => {
        setModalMode('edit');
        setSelectedRoomType(roomType);
        setFormOpened(true);
    };

    const openDetailsModal = (roomType) => {
        setSelectedRoomType(roomType);
        setDetailsOpened(true);
    };

    const handleSubmit = (values) => {
        const normalizedValues = {
            ...values,
            standardOccupancy: Number(values.standardOccupancy),
            maxOccupancy: Number(values.maxOccupancy),
            baseRate: Number(values.baseRate),
            extraPersonFee: Number(values.extraPersonFee || 0),
        };

        if (modalMode === 'create') {
            roomTypeApi.createRoomType(normalizedValues)
                    .then((created) => {
                        setRoomTypes((currentRoomTypes) => [created, ...currentRoomTypes]);
                        notifications.show({color: 'green', message: 'Room type created and saved to database.'});
                        setFormOpened(false);
                    })
                    .catch((error) => {
                        console.error('Error creating room type:', error);
                        notifications.show({
                            color: 'red',
                            message: getApiErrorMessage(error, 'Create room type failed.'),
                        });
                    });
            return;
        }

        roomTypeApi.updateRoomType(selectedRoomType.id, normalizedValues)
                .then((updated) => {
                    setRoomTypes((currentRoomTypes) => currentRoomTypes.map((roomType) => (
                            roomType.id === selectedRoomType.id
                                    ? updated
                                    : roomType
                    )));
                    notifications.show({color: 'green', message: 'Room type updated in database.'});
                    setFormOpened(false);
                })
                .catch((error) => {
                    console.error('Error updating room type:', error);
                    notifications.show({
                        color: 'red',
                        message: getApiErrorMessage(error, 'Update room type failed.'),
                    });
                });
    };

    const handleDelete = (roomType) => {
        modals.openConfirmModal({
            title: 'Delete room type',
            centered: true,
            children: <Text size="sm">Delete {roomType.name}? This action will also delete it from database.</Text>,
            labels: {confirm: 'Delete', cancel: 'Cancel'},
            confirmProps: {color: 'red'},
            onConfirm: () => {
                roomTypeApi.deleteRoomType(roomType.id)
                        .then(() => {
                            setRoomTypes((currentRoomTypes) => currentRoomTypes.filter((item) => item.id !== roomType.id));
                            notifications.show({color: 'green', message: 'Room type deleted from database.'});
                        })
                        .catch((error) => {
                            console.error('Error deleting room type:', error);
                            notifications.show({
                                color: 'red',
                                message: getApiErrorMessage(error, 'Delete room type failed.'),
                            });
                        });
            },
        });
    };

    return (
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={1}>Room Types</Title>
                    <Button leftSection={<IconPlus size={16}/>} onClick={openCreateModal}>
                        Add New Room Type
                    </Button>
                </Group>

                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="lg">
                        <TextInput
                                placeholder="Search"
                                leftSection={<IconSearch size={16}/>}
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.currentTarget.value)}
                                maw={460}
                        />

                        <ScrollArea>
                            <Table highlightOnHover verticalSpacing="lg" miw={980}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Type Name</Table.Th>
                                        <Table.Th>Standard Occupancy</Table.Th>
                                        <Table.Th>Max Occupancy</Table.Th>
                                        <Table.Th>Base Rate per Night (đ)</Table.Th>
                                        <Table.Th>Action</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredRoomTypes.length > 0 ? filteredRoomTypes.map((roomType) => (
                                            <Table.Tr key={roomType.id}>
                                                <Table.Td fw={600}>{roomType.name}</Table.Td>
                                                <Table.Td>{roomType.standardOccupancy}</Table.Td>
                                                <Table.Td>{roomType.maxOccupancy}</Table.Td>
                                                <Table.Td>{formatPrice(roomType.baseRate)}</Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" wrap="nowrap">
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="blue"
                                                                onClick={() => openDetailsModal(roomType)}
                                                                aria-label={`View ${roomType.name}`}
                                                        >
                                                            <IconEye size={18}/>
                                                        </ActionIcon>
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="dark"
                                                                onClick={() => openEditModal(roomType)}
                                                                aria-label={`Edit ${roomType.name}`}
                                                        >
                                                            <IconEdit size={18}/>
                                                        </ActionIcon>
                                                        <ActionIcon
                                                                variant="subtle"
                                                                color="red"
                                                                onClick={() => handleDelete(roomType)}
                                                                aria-label={`Delete ${roomType.name}`}
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
                                                        No room types matched the current search.
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Stack>
                </Paper>

                <RoomTypeFormModal
                        key={selectedRoomType?.id ?? 'new'}
                        opened={formOpened}
                        mode={modalMode}
                        initialValues={selectedRoomType || emptyRoomType}
                        onClose={() => setFormOpened(false)}
                        onSubmit={handleSubmit}
                />

                <RoomTypeDetailsModal
                        opened={detailsOpened}
                        roomType={selectedRoomType && selectedRoomType.id ? selectedRoomType : null}
                        onClose={() => setDetailsOpened(false)}
                />
            </Stack>
    );
}
