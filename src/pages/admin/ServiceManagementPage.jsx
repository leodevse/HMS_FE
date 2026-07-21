import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    Modal,
    NumberInput,
    Paper,
    Pagination,
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
import {IconEdit, IconEye, IconMassage, IconPlus, IconSearch, IconToolsKitchen2, IconTrash,} from '@tabler/icons-react';
import {adminServiceApi} from '../../apis/admin/serviceApi';

const serviceCategoryOptions = ['Spa', 'Minibar', 'F&B'];

const categoryIconMap = {
    Spa: IconMassage,
    Minibar: IconToolsKitchen2,
    'F&B': IconToolsKitchen2,
};

const categoryColorMap = {
    Spa: 'pink',
    Minibar: 'teal',
    'F&B': 'orange',
};

const emptyService = {
    name: '',
    serviceCategory: 'Spa',
    price: 0,
    description: '',
    duration: '',
    availability: 'Yes',
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

function ServiceFormModal({opened, mode, initialValues, onClose, onSubmit}) {
    const form = useForm({
        mode: 'controlled',
        initialValues,
        validate: {
            name: (value) => (value.trim().length < 2 ? 'Service name is required' : null),
            serviceCategory: (value) => (!value ? 'Category is required' : null),
            price: (value) => (value <= 0 ? 'Price must be greater than 0' : null),
            duration: (value) => (value.trim().length < 1 ? 'Duration is required' : null),
            availability: (value) => (!value ? 'Availability is required' : null),
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
                    title={mode === 'create' ? 'Add New Service' : 'Edit Service'}
                    centered
                    size="lg"
            >
                <form onSubmit={form.onSubmit(onSubmit)}>
                    <Stack>
                        <Group grow align="start">
                            <TextInput
                                    label="Service Name"
                                    placeholder="e.g. Aroma Massage"
                                    {...form.getInputProps('name')}
                            />
                            <Select
                                    label="Category"
                                    data={serviceCategoryOptions}
                                    {...form.getInputProps('serviceCategory')}
                            />
                        </Group>

                        <NumberInput
                                label="Price (đ)"
                                min={0.01}
                                decimalScale={2}
                                fixedDecimalScale
                                thousandSeparator=","
                                {...form.getInputProps('price')}
                        />

                        <Group grow align="start">
                            <TextInput
                                    label="Duration"
                                    placeholder="e.g. 30 minutes"
                                    {...form.getInputProps('duration')}
                            />
                            <Select
                                    label="Availability"
                                    data={['Yes', 'No']}
                                    {...form.getInputProps('availability')}
                            />
                        </Group>

                        <Textarea
                                label="Description"
                                placeholder="Describe this service"
                                autosize
                                minRows={2}
                                maxRows={4}
                                {...form.getInputProps('description')}
                        />

                        <Group justify="flex-end">
                            <Button variant="default" onClick={onClose}>Cancel</Button>
                            <Button type="submit">
                                {mode === 'create' ? 'Create service' : 'Save changes'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
    );
}

function ServiceDetailsModal({opened, service, onClose}) {
    if (!service) {
        return null;
    }

    const CategoryIcon = categoryIconMap[service.serviceCategory] || IconToolsKitchen2;

    return (
            <Modal opened={opened} onClose={onClose} title={service.name} centered>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Category</Text>
                        <Badge
                                color={categoryColorMap[service.serviceCategory]}
                                variant="light"
                                leftSection={<CategoryIcon size={12}/>}
                        >
                            {service.serviceCategory}
                        </Badge>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Price</Text>
                        <Text>{formatPrice(service.price)}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Duration</Text>
                        <Text>{service.duration || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Availability</Text>
                        <Text>{service.availability || '-'}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text fw={600}>Service ID</Text>
                        <Text>{service.id}</Text>
                    </Group>
                    <div>
                        <Text fw={600}>Description</Text>
                        <Text c="dimmed">{service.description || '-'}</Text>
                    </div>
                </Stack>
            </Modal>
    );
}

export default function ServiceManagementPage() {
    const PAGE_SIZE = 8;
    const [services, setServices] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [page, setPage] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [formOpened, setFormOpened] = useState(false);
    const [detailsOpened, setDetailsOpened] = useState(false);

    useEffect(() => {
        let ignore = false;

        adminServiceApi.getServices()
                .then((data) => {
                    if (!ignore) {
                        setServices(data);
                    }
                })
                .catch((error) => {
                    console.error('Error isLoading services:', error);
                    notifications.show({
                        color: 'red',
                        message: 'Failed to load services from database.',
                    });
                });

        return () => {
            ignore = true;
        };
    }, []);

    const filteredServices = services.filter((service) => {
        const query = searchValue.trim().toLowerCase();
        const matchesQuery = !query
                || service.name.toLowerCase().includes(query)
                || service.serviceCategory.toLowerCase().includes(query);
        const matchesCategory = !categoryFilter || service.serviceCategory === categoryFilter;

        return matchesQuery && matchesCategory;
    });

    const totalServicePages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
    const paginatedServices = filteredServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedService({...emptyService});
        setFormOpened(true);
    };

    useEffect(() => {
        const pageCount = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
        if (page > pageCount) {
            setPage(pageCount);
        }
    }, [filteredServices.length, page]);

    const openEditModal = (service) => {
        setModalMode('edit');
        setSelectedService(service);
        setFormOpened(true);
    };

    const openDetailsModal = (service) => {
        setSelectedService(service);
        setDetailsOpened(true);
    };

    const handleSubmit = (values) => {
        const normalized = {
            ...values,
            price: Number(values.price),
        };

        if (modalMode === 'create') {
            adminServiceApi.createService(normalized)
                    .then((created) => {
                        setServices((prev) => [created, ...prev]);
                        notifications.show({
                            color: 'green',
                            message: 'Service created and saved to database.',
                        });
                        setFormOpened(false);
                    })
                    .catch((error) => {
                        console.error('Error creating service:', error);
                        notifications.show({
                            color: 'red',
                            message: getApiErrorMessage(error, 'Create service failed.'),
                        });
                    });
            return;
        }

        adminServiceApi.updateService(selectedService.id, normalized)
                .then((updated) => {
                    setServices((prev) => prev.map((s) => (
                            s.id === selectedService.id ? updated : s
                    )));
                    notifications.show({
                        color: 'green',
                        message: 'Service updated in database.',
                    });
                    setFormOpened(false);
                })
                .catch((error) => {
                    console.error('Error updating service:', error);
                    notifications.show({
                        color: 'red',
                        message: getApiErrorMessage(error, 'Update service failed.'),
                    });
                });
    };

    const handleDelete = (service) => {
        modals.openConfirmModal({
            title: 'Delete service',
            centered: true,
            children: <Text size="sm">Delete <b>{service.name}</b>? This action will also delete it from
                database.</Text>,
            labels: {confirm: 'Delete', cancel: 'Cancel'},
            confirmProps: {color: 'red'},
            onConfirm: () => {
                adminServiceApi.deleteService(service.id)
                        .then(() => {
                            setServices((prev) => prev.filter((s) => s.id !== service.id));
                            notifications.show({
                                color: 'green',
                                message: 'Service deleted from database.',
                            });
                        })
                        .catch((error) => {
                            console.error('Error deleting service:', error);
                            notifications.show({
                                color: 'red',
                                message: getApiErrorMessage(error, 'Delete service failed.'),
                            });
                        });
            },
        });
    };

    return (
            <Stack gap="lg">
                <Group justify="space-between" align="center">
                    <Title order={1}>Services</Title>
                    <Button leftSection={<IconPlus size={16}/>} onClick={openCreateModal}>
                        Add New Service
                    </Button>
                </Group>

                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="lg">
                        <Group justify="space-between" align="flex-end">
                            <Title order={2}>Services</Title>
                            <Group>
                                <TextInput
                                        placeholder="Search"
                                        leftSection={<IconSearch size={16}/>}
                                        value={searchValue}
                                        onChange={(event) => setSearchValue(event.currentTarget.value)}
                                        w={220}
                                />
                                <Select
                                        clearable
                                        placeholder="By Category"
                                        data={serviceCategoryOptions}
                                        value={categoryFilter}
                                        onChange={setCategoryFilter}
                                        w={160}
                                />
                            </Group>
                        </Group>

                        <Divider/>

                        <ScrollArea>
                            <Table highlightOnHover verticalSpacing="md" miw={720}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Service Name</Table.Th>
                                        <Table.Th>Type</Table.Th>
                                        <Table.Th>Description</Table.Th>
                                        <Table.Th>Price (đ)</Table.Th>
                                        <Table.Th>Duration</Table.Th>
                                        <Table.Th>Availability</Table.Th>
                                        <Table.Th>Action</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {paginatedServices.length > 0 ? paginatedServices.map((service) => {
                                        const CategoryIcon = categoryIconMap[service.serviceCategory] || IconToolsKitchen2;

                                        return (
                                                <Table.Tr key={service.id}>
                                                    <Table.Td fw={600}>{service.name}</Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                                color={categoryColorMap[service.serviceCategory]}
                                                                variant="light"
                                                                leftSection={<CategoryIcon size={12}/>}
                                                        >
                                                            {service.serviceCategory}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>{service.description || '-'}</Table.Td>
                                                    <Table.Td>{formatPrice(service.price)}</Table.Td>
                                                    <Table.Td>{service.duration || '-'}</Table.Td>
                                                    <Table.Td>{service.availability}</Table.Td>
                                                    <Table.Td>
                                                        <Group spacing="xs" wrap="nowrap">
                                                            <Button size="xs" variant="subtle" onClick={() => openDetailsModal(service)}>
                                                                View
                                                            </Button>
                                                            <Button size="xs" variant="subtle" onClick={() => openEditModal(service)}>
                                                                Edit
                                                            </Button>
                                                            <Button size="xs" variant="outline" color="red" onClick={() => handleDelete(service)}>
                                                                Delete
                                                            </Button>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                        );
                                    }) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={7}>
                                                    <Text ta="center" py="lg" c="dimmed">
                                                        No services matched the current search.
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                        <Group position="apart" align="center" mt="md">
                            <Text size="sm" c="dimmed">Showing {paginatedServices.length} of {filteredServices.length} services</Text>
                            <Pagination total={totalServicePages} page={page} onChange={setPage} color="blue" withEdges />
                        </Group>
                    </Stack>
                </Paper>

                <ServiceFormModal
                        key={selectedService?.id ?? 'new'}
                        opened={formOpened}
                        mode={modalMode}
                        initialValues={selectedService || emptyService}
                        onClose={() => setFormOpened(false)}
                        onSubmit={handleSubmit}
                />

                <ServiceDetailsModal
                        opened={detailsOpened}
                        service={selectedService && selectedService.id ? selectedService : null}
                        onClose={() => setDetailsOpened(false)}
                />
            </Stack>
    );
}
