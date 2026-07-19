import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
    ActionIcon,
    Alert,
    Anchor,
    Box,
    Breadcrumbs,
    Button,
    Card,
    Center,
    Container,
    Group,
    Loader,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    Title
} from '@mantine/core';
import {
    IconArrowLeft,
    IconCheck,
    IconChevronRight,
    IconInfoCircle,
    IconPlus,
    IconTrash,
    IconX
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {useAuth} from '../../hooks/useAuth';
import {createServiceBookings, getActiveAllocations} from '../../apis/customer/serviceBookingApi';
import {authApi} from '../../apis/auth/authApi';

export default function ServiceCheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {user: customer} = useAuth();

    const cart = location.state?.cart || [];
    const [allocations, setAllocations] = useState(() => {
        const init = {};
        cart.forEach(item => {
            init[item.id] = [{roomId: null, qty: item.quantity}];
        });
        return init;
    });

    const [activeRooms, setActiveRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [customerId, setCustomerId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!customer) {
            setLoadingRooms(false);
            return;
        }

        const fetchProfileAndRooms = async () => {
            try {
                // 1. Lấy thông tin profile để có được customerId chính xác từ DB
                const res = await authApi.getMyProfile();
                const profileData = res.data;

                if (profileData && profileData.id) {
                    const cId = profileData.id;
                    setCustomerId(cId);

                    // 2. Lấy danh sách phòng đang sử dụng (IN_HOUSE)
                    const data = await getActiveAllocations(cId);
                    const options = data.map(alloc => ({
                        value: String(alloc.allocationId),
                        label: `${alloc.roomNumber} - ${alloc.roomClassName}`
                    }));
                    setActiveRooms(options);
                }
            } catch (error) {
                console.error("Error isLoading profile or rooms:", error);
            } finally {
                setLoadingRooms(false);
            }
        };

        fetchProfileAndRooms();
    }, [customer]);

    if (cart.length === 0) {
        return (
                <Container py={60} ta="center">
                    <Title order={2} mb="md">Your cart is empty</Title>
                    <Button onClick={() => navigate('/user/services')} color="blue">
                        Back to services list
                    </Button>
                </Container>
        );
    }

    const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const formatPrice = (price) =>
            new Intl.NumberFormat('en-US', {style: 'currency', currency: 'VND'}).format(price || 0);

    const handleUpdateAlloc = (serviceId, index, field, value) => {
        setAllocations(prev => {
            const newAllocs = [...prev[serviceId]];
            newAllocs[index] = {...newAllocs[index], [field]: value};
            return {...prev, [serviceId]: newAllocs};
        });
    };

    const handleRemoveAlloc = (serviceId, index) => {
        setAllocations(prev => {
            const newAllocs = [...prev[serviceId]];
            newAllocs.splice(index, 1);
            return {...prev, [serviceId]: newAllocs};
        });
    };

    const handleAddAlloc = (serviceId) => {
        setAllocations(prev => {
            const currentAllocs = prev[serviceId];
            const currentTotal = currentAllocs.reduce((sum, a) => sum + (a.qty || 0), 0);
            const item = cart.find(i => i.id === serviceId);
            const remaining = item.quantity - currentTotal;

            return {
                ...prev,
                [serviceId]: [
                    ...currentAllocs,
                    {roomId: null, qty: remaining > 0 ? remaining : 1}
                ]
            };
        });
    };

    const handleConfirmBooking = async () => {
        if (!customer) {
            notifications.show({
                title: 'Login Required',
                message: 'Please login before ordering services!',
                color: 'orange',
                icon: <IconInfoCircle size={16}/>
            });
            navigate('/login');
            return;
        }

        if (!customerId) {
            notifications.show({
                title: 'Data isLoading',
                message: 'Customer information is being loaded, please try again in a moment!',
                color: 'blue'
            });
            return;
        }

        let isValid = true;
        const finalPayload = {
            customerId: customerId,
            items: []
        };

        for (const item of cart) {
            const allocs = allocations[item.id] || [];

            // 1. Kiểm tra xem tổng chia có bằng tổng đặt không
            const totalQty = allocs.reduce((sum, a) => sum + (a.qty || 0), 0);
            if (totalQty !== item.quantity) {
                notifications.show({
                    title: 'Quantity mismatch',
                    message: `Service "${item.name}" has an allocation quantity (${totalQty}) that does not match the purchased quantity (${item.quantity})!`,
                    color: 'red',
                    icon: <IconX size={16}/>
                });
                isValid = false;
                break;
            }

            // 2. Chắc chắn rằng mỗi dòng chia đều đã được chọn phòng
            for (const a of allocs) {
                if (!a.roomId) {
                    notifications.show({
                        title: 'Room information missing',
                        message: `Please select a specific room for the service "${item.name}"!`,
                        color: 'red',
                        icon: <IconX size={16}/>
                    });
                    isValid = false;
                    break;
                }

                finalPayload.items.push({
                    serviceId: item.id,
                    allocationId: parseInt(a.roomId),
                    quantity: a.qty,
                    price: item.price
                });
            }
            if (!isValid) break;
        }

        if (!isValid) return;

        setIsSubmitting(true);
        try {
            await createServiceBookings(finalPayload);
            notifications.show({
                title: 'Service booked successfully',
                message: 'Your service order has been successfully recorded! A staff member will contact you for confirmation and serve you shortly.',
                color: 'blue',
                icon: <IconCheck size={16}/>,
                autoClose: 8000
            });
            navigate('/user/services');
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data || 'An error occurred while booking the service. Please try again!',
                color: 'red',
                icon: <IconX size={16}/>
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
            <Box style={{backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px 0'}}>
                <Container size="md">
                    {/* ── Breadcrumbs ── */}
                    <Breadcrumbs mb="md" separator={<IconChevronRight size={14}/>} style={{fontSize: '14px'}}>
                        <Anchor onClick={() => navigate('/user/services')} style={{cursor: 'pointer', fontWeight: 500}}>
                            Service
                        </Anchor>
                        <Text fw={500} color="dimmed">Service Checkout</Text>
                    </Breadcrumbs>

                    <Anchor
                            onClick={() => navigate('/user/services')}
                            c="dimmed"
                            style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px'}}
                    >
                        <IconArrowLeft size={16}/> Back to Services page
                    </Anchor>

                    <Card shadow="sm" padding="xl" radius="md" withBorder>
                        <Title order={2} mb="xl"
                               style={{color: '#2c3e50', borderBottom: '2px solid #e9ecef', paddingBottom: '16px'}}>
                            Service Booking Details
                        </Title>

                        {/* Loading Context hoặc Chưa Đăng nhập & Check-in */}
                        {loadingRooms ? (
                                <Center py={40}><Loader color="blue"/></Center>
                        ) : !customer ? (
                                <Alert icon={<IconInfoCircle size={16}/>} color="blue" mb="lg">
                                    You need to log in and have an active room rental to continue booking services.
                                </Alert>
                        ) : activeRooms.length === 0 ? (
                                <Alert icon={<IconInfoCircle size={16}/>} color="orange" mb="lg">
                                    You haven't checked in yet or your booking hasn't been confirmed, so you cannot book
                                    services to your room at this time.
                                </Alert>
                        ) : (
                                <Text c="dimmed" mb="md" size="sm">
                                    Please allocate the services and quantities to the rooms you are currently using:
                                </Text>
                        )}

                        <Table striped highlightOnHover withTableBorder>
                            <Table.Thead>
                                <Table.Tr style={{backgroundColor: '#f1f3f5'}}>
                                    <Table.Th>Service</Table.Th>
                                    <Table.Th style={{textAlign: 'center'}}>Purchased quantity</Table.Th>
                                    <Table.Th>Room allocation</Table.Th>
                                    <Table.Th style={{textAlign: 'right'}}>Subtotal</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {cart.map((item) => {
                                    const allocs = allocations[item.id] || [];
                                    const currentTotal = allocs.reduce((sum, a) => sum + (a.qty || 0), 0);
                                    const isQtyMatched = currentTotal === item.quantity;

                                    return (
                                            <Table.Tr key={item.id}>
                                                <Table.Td>
                                                    <Text fw={600}>{item.name}</Text>
                                                    <Text size="xs" c="dimmed">{formatPrice(item.price)} / use</Text>
                                                </Table.Td>

                                                <Table.Td style={{
                                                    textAlign: 'center',
                                                    verticalAlign: 'top',
                                                    paddingTop: '16px'
                                                }}>
                                                    <Text fw={700} size="lg">{item.quantity}</Text>
                                                    {!isQtyMatched && (
                                                            <Text size="xs" c="red" mt={4} fw={500}>
                                                                Entered: {currentTotal}
                                                            </Text>
                                                    )}
                                                </Table.Td>

                                                <Table.Td>
                                                    <Stack gap="sm" mt="xs" mb="xs">
                                                        {allocs.map((alloc, index) => (
                                                                <Group key={index} gap="xs" wrap="nowrap">
                                                                    <Select
                                                                            placeholder="Select room..."
                                                                            data={activeRooms}
                                                                            value={alloc.roomId}
                                                                            onChange={(val) => handleUpdateAlloc(item.id, index, 'roomId', val)}
                                                                            style={{flex: 1, minWidth: 120}}
                                                                            disabled={activeRooms.length === 0}
                                                                    />
                                                                    <NumberInput
                                                                            min={1}
                                                                            max={item.quantity}
                                                                            value={alloc.qty}
                                                                            onChange={(val) => handleUpdateAlloc(item.id, index, 'qty', val || 1)}
                                                                            style={{width: 70}}
                                                                    />
                                                                    <ActionIcon
                                                                            color="red"
                                                                            variant="subtle"
                                                                            onClick={() => handleRemoveAlloc(item.id, index)}
                                                                            disabled={allocs.length === 1} // Không cho xóa nếu chỉ có 1 dòng
                                                                    >
                                                                        <IconTrash size={16}/>
                                                                    </ActionIcon>
                                                                </Group>
                                                        ))}

                                                        {currentTotal < item.quantity && (
                                                                <Button
                                                                        variant="light"
                                                                        color="blue"
                                                                        size="xs"
                                                                        leftSection={<IconPlus size={14}/>}
                                                                        onClick={() => handleAddAlloc(item.id)}
                                                                        style={{alignSelf: 'flex-start'}}
                                                                >
                                                                    Add another room
                                                                </Button>
                                                        )}
                                                    </Stack>
                                                </Table.Td>

                                                <Table.Td style={{
                                                    textAlign: 'right',
                                                    verticalAlign: 'top',
                                                    paddingTop: '16px'
                                                }}>
                                                    <Text fw={600} color="blue.6">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>

                        <Group justify="space-between" mt="xl" pt="md" style={{borderTop: '2px solid #e9ecef'}}>
                            <Title order={3}>Total payment:</Title>
                            <Title order={2} color="blue.6">
                                {formatPrice(getTotalPrice())}
                            </Title>
                        </Group>

                        <Group justify="flex-end" mt="xl">
                            <Button
                                    variant="default"
                                    size="lg"
                                    onClick={() => navigate('/user/services')}
                            >
                                Cancel
                            </Button>
                            <Button
                                    size="lg"
                                    color="blue"
                                    leftSection={<IconCheck size={20}/>}
                                    onClick={handleConfirmBooking}
                                    loading={isSubmitting}
                                    disabled={loadingRooms || !customer || activeRooms.length === 0}
                            >
                                Confirm Booking
                            </Button>
                        </Group>
                    </Card>
                </Container>
            </Box>
    );
}
