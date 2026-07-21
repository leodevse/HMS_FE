import {useEffect, useState} from 'react';
import {
    Anchor,
    Badge,
    Button,
    Divider,
    Group,
    Modal,
    MultiSelect,
    NumberInput,
    Pagination,
    Paper,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {modals} from '@mantine/modals';
import {notifications} from '@mantine/notifications';
import {IconPlus, IconSearch} from '@tabler/icons-react';
import {roomTypeApi} from '../../apis/admin/roomTypeApi';

const PAGE_SIZE = 7;

const emptyRoomType = {
    name: '',
    standardOccupancy: 1,
    maxOccupancy: 2,
    baseRate: 90,
    extraPersonFee: 0,
    amenities: [],
};

const AMENITY_OPTIONS = [
    {value: 'wifi', label: 'WiFi', emoji: '📶'},
    {value: 'tv', label: 'TV', emoji: '📺'},
    {value: 'ac', label: 'A/C', emoji: '❄️'},
    {value: 'bath', label: 'Bath', emoji: '🛁'},
    {value: 'pool', label: 'Pool Access', emoji: '🏊'},
    {value: 'minibar', label: 'Mini bar', emoji: '🍹'},
    {value: 'gym', label: 'Gym Access', emoji: '🏋️'},
    {value: 'parking', label: 'Parking', emoji: '🅿️'},
];

const amenityColors = {
    wifi: 'green',
    tv: 'blue',
    ac: 'cyan',
    bath: 'teal',
    pool: 'indigo',
    minibar: 'grape',
    gym: 'orange',
    parking: 'gray',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

function formatPrice(value) {
    return `$${currencyFormatter.format(Number(value) || 0)}`;
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
                    value < values.standardOccupancy ? 'Max occupancy must be >= standard occupancy' : null
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
                                placeholder="e.g. Deluxe"
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
                                    label="Base Rate per Night ($)"
                                    min={1}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    thousandSeparator=","
                                    {...form.getInputProps('baseRate')}
                            />
                        </Group>

                        <NumberInput
                                label="Extra Person Fee ($)"
                                min={0}
                                decimalScale={2}
                                fixedDecimalScale
                                thousandSeparator=","
                                {...form.getInputProps('extraPersonFee')}
                        />

                        <MultiSelect
                                label="Amenities"
                                placeholder="Select amenities"
                                data={AMENITY_OPTIONS.map((a) => ({value: a.value, label: `${a.emoji} ${a.label}`}))}
                                {...form.getInputProps('amenities')}
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
                    <Stack gap="xs">
                        <Text fw={600}>Amenities</Text>
                        <Group gap="xs">
                            {(roomType.amenities || []).length > 0 ? (
                                    roomType.amenities.map((a) => {
                                        const opt = AMENITY_OPTIONS.find((o) => o.value === a);
                                        return opt ? (
                                                <Badge key={a} color={amenityColors[a] || 'blue'} variant="light">
                                                    {opt.emoji} {opt.label}
                                                </Badge>
                                        ) : (
                                                <Badge key={a} color="gray" variant="light">{a}</Badge>
                                        );
                                    })
                            ) : (
                                    <Text c="dimmed" size="sm">No amenities</Text>
                            )}
                        </Group>
                    </Stack>
                </Stack>
            </Modal>
    );
}

function AmenitiesBadges({amenities}) {
    if (!amenities || amenities.length === 0) return <Text size="sm" c="dimmed">—</Text>;
    return (
            <Group gap={4} wrap="wrap">
                {amenities.map((a) => {
                    const opt = AMENITY_OPTIONS.find((o) => o.value === a);
                    return (
                            <Tooltip key={a} label={opt?.label || a} withArrow>
                                <Badge
                                        color={amenityColors[a] || 'blue'}
                                        variant="light"
                                        size="sm"
                                        style={{cursor: 'default'}}
                                >
                                    {opt?.emoji || a}
                                </Badge>
                            </Tooltip>
                    );
                })}
            </Group>
    );
}

export default function RoomTypesPage() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [formOpened, setFormOpened] = useState(false);
    const [detailsOpened, setDetailsOpened] = useState(false);
    const [page, setPage] = useState(1);

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

    const totalPages = Math.ceil(filteredRoomTypes.length / PAGE_SIZE);
    const pagedRoomTypes = filteredRoomTypes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedRoomType(emptyRoomType);
        setFormOpened(true);
    };

    const openEditModal = (roomType) => {
        setModalMode('edit');
        setSelectedRoomType({...emptyRoomType, ...roomType});
        setFormOpened(true);
    };

    const handleSubmit = (values) => {
        const normalizedValues = {
            ...values,
            standardOccupancy: Number(values.standardOccupancy),
            maxOccupancy: Number(values.maxOccupancy),
            baseRate: Number(values.baseRate),
            extraPersonFee: Number(values.extraPersonFee || 0),
            amenities: values.amenities || [],
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
                                    ? {...updated, amenities: normalizedValues.amenities}
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
                        + Add New Room Type
                    </Button>
                </Group>

                <Paper withBorder radius="md" p="lg">
                    <TextInput
                            placeholder="Search"
                            leftSection={<IconSearch size={16}/>}
                            value={searchValue}
                            onChange={(event) => {
                                setSearchValue(event.currentTarget.value);
                                setPage(1);
                            }}
                            maw={460}
                            mb="md"
                    />

                    <Divider mb="md"/>

                    <div style={{overflowX: 'auto'}}>
                        <Table highlightOnHover verticalSpacing="lg" horizontalSpacing="md" miw={900}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>TYPE NAME</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>STANDARD OCCUPANCY</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>MAX OCCUPANCY</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>BASE RATE PER NIGHT ($)</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>AMENITIES</Table.Th>
                                    <Table.Th style={{fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#888'}}>ACTION</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pagedRoomTypes.length > 0 ? pagedRoomTypes.map((roomType) => (
                                        <Table.Tr key={roomType.id}>
                                            <Table.Td fw={600}>{roomType.name}</Table.Td>
                                            <Table.Td>{roomType.standardOccupancy}</Table.Td>
                                            <Table.Td c="red" fw={600}>{roomType.maxOccupancy}</Table.Td>
                                            <Table.Td fw={600}>{formatPrice(roomType.baseRate)}</Table.Td>
                                            <Table.Td>
                                                <AmenitiesBadges amenities={roomType.amenities}/>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} wrap="nowrap">
                                                    <Anchor
                                                            size="sm"
                                                            c="blue"
                                                            fw={500}
                                                            onClick={() => openEditModal(roomType)}
                                                            style={{cursor: 'pointer'}}
                                                    >
                                                        View/Edit
                                                    </Anchor>
                                                    <Text size="sm" c="dimmed">|</Text>
                                                    <Anchor
                                                            size="sm"
                                                            c="red"
                                                            fw={500}
                                                            onClick={() => handleDelete(roomType)}
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
                                                    No room types matched the current search.
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
