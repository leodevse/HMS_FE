import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Card, Title, Text, TextInput, Button,
    Stack, Group, Divider, Textarea, Badge, Alert, Breadcrumbs, Anchor
} from '@mantine/core';
import { IconUser, IconPhone, IconIdBadge, IconCalendar, IconUsers, IconCoin, IconArrowLeft, IconInfoCircle, IconLogin, IconCheck, IconX, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { createBooking } from '../../apis/customer/reservationApi';
import { authApi } from '../../apis/auth/authApi';
import { useAuth } from '../../hooks/useAuth';

export default function CheckoutPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: customer } = useAuth();

    const bookingData = location.state;

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [identityCard, setIdentityCard] = useState('');
    const [note, setNote] = useState('');
    const [customerId, setCustomerId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tự động điền thông tin từ customer đã đăng nhập
    useEffect(() => {
        if (!customer) return;

        // Điền ngay fullName từ context (luôn có)
        if (customer.fullName) setName(customer.fullName);

        // Gọi API /me để lấy thông tin chi tiết từ DB
        authApi.getMyProfile()
            .then(res => {
                // Backend trả về: { status: "success", message: "...", data: { id, fullName, phoneNumber, identityCard, ... } }
                const profileData = res.data;
                if (!profileData) return;

                if (profileData.id) setCustomerId(profileData.id);
                if (profileData.fullName) setName(profileData.fullName);
                if (profileData.phoneNumber) setPhone(profileData.phoneNumber);
                if (profileData.identityCard) setIdentityCard(profileData.identityCard);
            })
            .catch((err) => {
                console.error("Error fetching profile:", err);
            });
    }, [customer]);

    if (!bookingData) {
        return (
            <Container py={60} ta="center">
                <Title order={2} c="red" mb="md">Booking information not found</Title>
                <Button onClick={() => navigate('/user/booking')}>Back to Booking Page</Button>
            </Container>
        );
    }

    const { checkIn, checkOut, nights, guests, rooms } = bookingData;


    const totalPrice = rooms.reduce((sum, r) => sum + r.total, 0);
    const depositPrice = totalPrice * 0.2;

    const formatPrice = (price) =>
        new Intl.NumberFormat('en-US').format(price || 0);

    const handleConfirmBooking = async () => {
        if (!name.trim() || !phone.trim() || !identityCard.trim()) {
            notifications.show({
                title: 'Missing information',
                message: 'Please fill in all customer details!',
                color: 'red',
                icon: <IconX size={16} />
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const bookingPayload = {
                checkIn: dayjs(checkIn).toISOString(),
                checkOut: dayjs(checkOut).toISOString(),
                nights,
                guests,
                rooms: rooms.map(r => ({
                    id: r.id,
                    name: r.name,
                    quantity: r.quantity,
                    pricePerNight: r.pricePerNight,
                    standardCapacity: r.standardCapacity,
                    maxCapacity: r.maxCapacity,
                    total: r.total
                })),
                customer: {
                    customerId: customerId,
                    name,
                    phone,
                    identityCard,
                    note
                }
            };

            const response = await createBooking(bookingPayload);
            
            if (response.paymentUrl) {
                // Chuyển hướng người dùng qua trang VNPAY để trả tiền
                window.location.href = response.paymentUrl;
            } else {
                notifications.show({
                    title: 'Booking successful',
                    message: `Booking Code: ${response.reservationCode}.\nPlease contact the hotel to prepare for the deposit payment of ${new Intl.NumberFormat('en-US').format(response.depositAmount)} VND.`,
                    color: 'blue',
                    icon: <IconCheck size={16} />,
                    autoClose: 8000
                });
                navigate('/user');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while booking. Please try again.';
            notifications.show({
                title: 'Error',
                message: errorMessage,
                color: 'red',
                icon: <IconX size={16} />
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Box style={{ backgroundColor: 'var(--mantine-color-blue-9)', color: 'white', padding: '50px 0' }}>
                <Container size="xl">
                    <Title order={1} style={{ fontSize: '28px', fontWeight: 700, color: 'white' }} mb={8}>
                        Confirm Information
                    </Title>
                    <Text style={{ fontSize: '16px', opacity: 0.85 }}>
                        Please fill in customer details and review your selected rooms
                    </Text>
                </Container>
            </Box>

            <Container size="xl" py={48}>
                {/* ── Breadcrumbs ── */}
                <Breadcrumbs mb="xl" separator={<IconChevronRight size={14} />} style={{ fontSize: '14px' }}>
                    <Anchor onClick={() => navigate('/user/booking')} style={{ cursor: 'pointer', fontWeight: 500 }}>
                        Checkout
                    </Anchor>
                    <Text fw={500} color="dimmed">Checkout Page</Text>
                </Breadcrumbs>

                <Grid gutter={32}>
                    {/* Left: Customer info form */}
                    <Grid.Col span={{ base: 12, md: 7 }}>
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => navigate(-1)}
                            mb="sm"
                            px={0}
                            styles={{ root: { '&:hover': { backgroundColor: 'transparent' } } }}
                        >
                            Go Back
                        </Button>
                         <Card shadow="sm" radius="md" withBorder padding="xl">
                            <Group justify="space-between" align="center" mb="lg">
                                <Title order={3} color="blue.9">Customer Information</Title>
                                {customer ? (
                                    <Badge color="blue" variant="light" leftSection={<IconInfoCircle size={12} />}>
                                        Auto-filled
                                    </Badge>
                                ) : (
                                    <Badge
                                        color="orange"
                                        variant="light"
                                        style={{ cursor: 'pointer' }}
                                        leftSection={<IconLogin size={12} />}
                                        onClick={() => navigate('/login')}
                                    >
                                        Log in to auto-fill
                                    </Badge>
                                )}
                            </Group>

                            <Stack gap="md">
                                <TextInput
                                    label="Full Name"
                                    placeholder="Enter the full name of the booker"
                                    value={name}
                                    onChange={(e) => setName(e.currentTarget.value)}
                                    leftSection={<IconUser size={16} color="blue" />}
                                    withAsterisk
                                    description={customer ? 'Changes will be updated in your account profile' : undefined}
                                />
                                <TextInput
                                    label="Phone Number"
                                    placeholder="Enter contact phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.currentTarget.value)}
                                    leftSection={<IconPhone size={16} color="blue" />}
                                    withAsterisk
                                    description={customer ? 'Changes will be updated in your account profile' : undefined}
                                />
                                <TextInput
                                    label="ID Card / Citizen ID"
                                    placeholder="Enter ID Card or Citizen ID number"
                                    value={identityCard}
                                    onChange={(e) => setIdentityCard(e.currentTarget.value)}
                                    leftSection={<IconIdBadge size={16} color="blue" />}
                                    withAsterisk
                                    description={customer ? 'Changes will be updated in your account profile' : undefined}
                                />
                                 <Textarea
                                    label="Note"
                                    placeholder="Additional notes (optional)"
                                    value={note}
                                    onChange={(e) => setNote(e.currentTarget.value)}
                                    minRows={3}
                                />
                            </Stack>
                        </Card>
                    </Grid.Col>

                    {/* Right: Booking Summary */}
                    <Grid.Col span={{ base: 12, md: 5 }}>
                        <Card shadow="md" radius="md" padding="xl" withBorder style={{ position: 'sticky', top: '24px' }}>
                            <Title order={3} mb="lg" color="blue.9">Booking Summary</Title>

                            <Stack gap="sm">
                                 <Group align="flex-start" wrap="nowrap">
                                    <IconCalendar size={20} color="blue" style={{ marginTop: 2 }} />
                                    <Box>
                                        <Text size="sm" fw={600}>Check-in</Text>
                                        <Text size="sm" c="dimmed">
                                            {dayjs(checkIn).format('HH:mm - DD/MM/YYYY')}
                                        </Text>
                                    </Box>
                                </Group>

                                 <Group align="flex-start" wrap="nowrap">
                                    <IconCalendar size={20} color="blue" style={{ marginTop: 2 }} />
                                    <Box>
                                        <Text size="sm" fw={600}>Check-out</Text>
                                        <Text size="sm" c="dimmed">
                                            {dayjs(checkOut).format('HH:mm - DD/MM/YYYY')}
                                        </Text>
                                    </Box>
                                </Group>

                                 <Group align="flex-start" wrap="nowrap">
                                    <IconUsers size={20} color="blue" style={{ marginTop: 2 }} />
                                    <Box>
                                        <Text size="sm" fw={600}>Guests</Text>
                                        <Text size="sm" c="dimmed">{guests} people</Text>
                                    </Box>
                                </Group>

                                 <Divider my="sm" />

                                <Text fw={600} mb={4}>Selected Rooms:</Text>
                                 {rooms.map((room, idx) => (
                                    <Group key={idx} justify="space-between" align="center" wrap="nowrap">
                                        <Box style={{ flex: 1 }}>
                                            <Text size="sm" fw={500}>{room.name}</Text>
                                            <Text size="xs" c="dimmed">{room.quantity} rooms × {nights} nights</Text>
                                        </Box>
                                        <Text size="sm" fw={600} color="blue.6">
                                            {formatPrice(room.total)} VND
                                        </Text>
                                    </Group>
                                ))}

                                 <Divider my="sm" />

                                <Group justify="space-between" align="center">
                                    <Group gap={6}>
                                        <IconCoin size={20} color="blue" />
                                        <Text size="md" fw={700}>Total Payment:</Text>
                                    </Group>
                                    <Text size="xl" fw={800} color="blue.6">
                                        {formatPrice(totalPrice)} VND
                                    </Text>
                                </Group>

                                 <Group justify="space-between" align="center" mt={4}>
                                    <Text size="sm" fw={600}>Deposit Amount (20%):</Text>
                                    <Text size="lg" fw={700} color="orange.7">
                                        {formatPrice(depositPrice)} VND
                                    </Text>
                                </Group>
                                 <Text size="xs" c="dimmed" ta="right">
                                    Please pay the deposit to confirm your booking
                                </Text>

                                <Button
                                    fullWidth
                                    size="lg"
                                    mt="xl"
                                    onClick={handleConfirmBooking}
                                    disabled={!name.trim() || !phone.trim() || !identityCard.trim()}
                                    loading={isSubmitting}
                                     color="blue"
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        padding: '14px',
                                    }}
                                >
                                    Confirm Booking
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
}
