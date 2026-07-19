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
    const [services, setServices] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
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

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedService({...emptyService});
        setFormOpened(true);
    };

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
                                        <Table.Th>Category</Table.Th>
                                        <Table.Th>Price (đ)</Table.Th>
                                        <Table.Th>Action</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredServices.length > 0 ? filteredServices.map((service) => {
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
                                                    <Table.Td>{formatPrice(service.price)}</Table.Td>
                                                    <Table.Td>
                                                        <Group gap="xs" wrap="nowrap">
                                                            <ActionIcon
                                                                    variant="subtle"
                                                                    color="blue"
                                                                    onClick={() => openDetailsModal(service)}
                                                                    aria-label={`View ${service.name}`}
                                                            >
                                                                <IconEye size={18}/>
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                    variant="subtle"
                                                                    color="dark"
                                                                    onClick={() => openEditModal(service)}
                                                                    aria-label={`Edit ${service.name}`}
                                                            >
                                                                <IconEdit size={18}/>
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                    variant="subtle"
                                                                    color="red"
                                                                    onClick={() => handleDelete(service)}
                                                                    aria-label={`Delete ${service.name}`}
                                                            >
                                                                <IconTrash size={18}/>
                                                            </ActionIcon>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                        );
                                    }) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={4}>
                                                    <Text ta="center" py="lg" c="dimmed">
                                                        No services matched the current search.
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
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
