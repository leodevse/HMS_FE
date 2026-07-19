// src/pages/customer/BookingDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Stack,
    Group,
    Text,
    Title,
    Badge,
    Button,
    Loader,
    Center,
    Grid,
    Divider,
    Table,
    Alert
} from '@mantine/core';
import {
    IconArrowLeft,
    IconCalendar,
    IconDoor,
    IconUsers,
    IconCoin,
    IconClock,
    IconBottle,
    IconAlertCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { customerApi } from '../../apis/customerApi.js';

const statusColors = {
    'PENDING_DEPOSIT': 'yellow',
    'CONFIRMED': 'blue',
    'IN_HOUSE': 'teal',
    'CHECKED_OUT': 'green',
    'FINISHED': 'green',
    'CANCELLED': 'red'
};

const statusLabels = {
    'PENDING_DEPOSIT': 'Pending',
    'CONFIRMED': 'Confirmed',
    'IN_HOUSE': 'In House',
    'CHECKED_OUT': 'Completed',
    'FINISHED': 'Finished',
    'CANCELLED': 'Cancelled'
};

export default function BookingDetailPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        setLoading(true);
        try {
            const response = await customerApi.getBookingDetails(bookingId);
            setBooking(response.data);
        } catch (error) {
            console.error('Fetch error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load booking details',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'VND 0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    if (!booking) {
        return (
            <Container size="lg" py="xl">
                <Alert color="red" title="Error">
                    Booking not found
                </Alert>
                <Button mt="md" onClick={() => navigate('/user/history')}>
                    Back to Bookings
                </Button>
            </Container>
        );
    }

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => navigate('/user/history')}
                    >
                        Back to Bookings
                    </Button>
                </Group>

                {/* Booking Info */}
                <Paper withBorder p="xl" radius="lg">
                    <Group justify="space-between" mb="md">
                        <Group>
                            <IconCalendar size={24} />
                            <div>
                                <Title order={2}>Booking {booking.code}</Title>
                                <Text size="sm" c="dimmed">Booking ID: {booking.id}</Text>
                            </div>
                        </Group>
                        <Badge
                            size="xl"
                            color={statusColors[booking.status]}
                            variant="filled"
                        >
                            {statusLabels[booking.status]}
                        </Badge>
                    </Group>

                    <Divider my="lg" />

                    <Grid>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Check-in</Text>
                            <Text>{formatDate(booking.checkIn)}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Check-out</Text>
                            <Text>{formatDate(booking.checkOut)}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Nights</Text>
                            <Text>{booking.nights} nights</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Guests</Text>
                            <Text>{booking.adults} adults {booking.children > 0 && `, ${booking.children} children`}</Text>
                        </Grid.Col>
                    </Grid>

                    <Divider my="lg" />

                    <Title order={3} mb="md">Room Information</Title>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Room Type</Text>
                            <Text>{booking.roomType}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text fw={500} size="sm" c="dimmed">Room Number</Text>
                            <Text>{booking.roomNumber || 'Not assigned'}</Text>
                        </Grid.Col>
                    </Grid>

                    <Divider my="lg" />

                    <Title order={3} mb="md">Payment Summary</Title>
                    <Table>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td>Room Charge ({booking.nights} nights)</Table.Td>
                                <Table.Td align="right">{formatCurrency(booking.totalPrice)}</Table.Td>
                            </Table.Tr>
                            {booking.services?.map((service, index) => (
                                <Table.Tr key={index}>
                                    <Table.Td>{service.name} x{service.quantity}</Table.Td>
                                    <Table.Td align="right">{formatCurrency(service.price)}</Table.Td>
                                </Table.Tr>
                            ))}
                            {booking.minibar?.map((item, index) => (
                                <Table.Tr key={index}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconBottle size={16} />
                                            {item.name} x{item.quantity}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td align="right">{formatCurrency(item.price)}</Table.Td>
                                </Table.Tr>
                            ))}
                            {booking.damages?.map((damage, index) => (
                                <Table.Tr key={index}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconAlertCircle size={16} color="red" />
                                            {damage.description} x{damage.quantity}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td align="right" c="red">{formatCurrency(damage.penalty)}</Table.Td>
                                </Table.Tr>
                            ))}
                            <Table.Tr>
                                <Table.Td fw={700}>Total</Table.Td>
                                <Table.Td align="right" fw={700}>{formatCurrency(booking.totalPrice)}</Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>Paid</Table.Td>
                                <Table.Td align="right" c="green">{formatCurrency(booking.paidAmount || 0)}</Table.Td>
                            </Table.Tr>
                            {booking.balance > 0 && (
                                <Table.Tr>
                                    <Table.Td fw={500} c="red">Balance Due</Table.Td>
                                    <Table.Td align="right" fw={500} c="red">{formatCurrency(booking.balance)}</Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>
            </Stack>
        </Container>
    );
}