import { useState, useEffect } from 'react';
import {
    Box, Container, Grid, Text, Title, Table, Group, Badge,
    NumberInput, Button, Divider, Stack, Card, Loader, Center,
    Select
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { IconUsers, IconBuilding, IconCalendar, IconCoin } from '@tabler/icons-react';
import { getRoomClassList } from '../../apis/customer/roomClassApi';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import '@mantine/dates/styles.css';
import { dateUtils } from '../../utils/dateUtils';
import { getMinimumCheckOut } from '../../utils/hotelStayPolicy';

export default function BookingPage() {
    const navigate = useNavigate();
    const [roomClasses, setRoomClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState({});

    const today = dayjs().hour(14).minute(0).second(0).millisecond(0).toDate();
    const tomorrow = dayjs().add(1, 'day').hour(12).minute(0).second(0).millisecond(0).toDate();

    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [guests, setGuests] = useState(1);

    const nights = checkIn && checkOut ? Math.max(1, dateUtils.dateDiff(checkIn, checkOut)) : 1;

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const inIso = checkIn ? dayjs(checkIn).format('YYYY-MM-DDTHH:mm:ss') : null;
                const outIso = checkOut ? dayjs(checkOut).format('YYYY-MM-DDTHH:mm:ss') : null;

                if (inIso && outIso && (dayjs(outIso).isBefore(dayjs(inIso)) || dayjs(outIso) === dayjs(inIso))) {
                    setLoading(false);
                    return;
                }
                const data = await getRoomClassList(0, 50, inIso, outIso);
                const rooms = data?.data || [];
                setRoomClasses(rooms);

                const initQty = {};
                rooms.forEach(r => { initQty[r.id] = 0; });
                setQuantities(initQty);
            } catch (err) {
                console.error('Error fetching rooms:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [checkIn, checkOut]);

    const formatPrice = (price) =>
        new Intl.NumberFormat('en-US').format(price || 0);

    const handleQuantityChange = (id, value, totalRooms) => {
        const val = Math.min(Math.max(0, Number(value) || 0), totalRooms);
        setQuantities(prev => ({ ...prev, [id]: val }));
    };

    // Tổng tiền
    const totalPrice = roomClasses.reduce((sum, room) => {
        const qty = quantities[room.id] || 0;
        return sum + qty * (room.basePrice || 0) * nights;
    }, 0);

    const hasSelection = Object.values(quantities).some(q => q > 0);

    const handleContinue = () => {
        // 1. Kiểm tra sức chứa (Guest count vs Max Capacity)
        let totalMaxCapacity = 0;
        roomClasses.forEach(room => {
            const qty = quantities[room.id] || 0;
            if (qty > 0) {
                totalMaxCapacity += (room.maxCapacity || room.standardCapacity || 0) * qty;
                console.log('Total guests:', guests, 'max capacity:', room.maxCapacity);
            }
        });
        

        if (guests > totalMaxCapacity) {
            notifications.show({
                title: 'Capacity exceeded',
                message: `Total guests (${guests}) exceeds the maximum capacity of selected rooms (${totalMaxCapacity} people). Please select more rooms or reduce guest count.`,
                color: 'red',
                autoClose: 5000,
            });
            return;
        }

        const totalSelectedRooms = Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0);
        if (guests < totalSelectedRooms) {
            notifications.show({
                title: 'Invalid room allocation',
                message: `At least one guest is required for each selected room (${totalSelectedRooms} rooms).`,
                color: 'red',
            });
            return;
        }

        const now = dayjs();
        const checkInDayjs = dayjs(checkIn);
        if (checkInDayjs.isSame(now, 'day')) {
            if (checkInDayjs.isBefore(now.add(1, 'hour'))) {
                notifications.show({
                    title: 'Invalid check-in time',
                    message: 'For same-day bookings, check-in time must be at least 1 hour from now.',
                    color: 'red',
                    autoClose: 5000,
                });
                return;
            }
        }

        const maxLimit = dayjs().add(2, 'month');
        if (checkInDayjs.isAfter(maxLimit)) {
             notifications.show({
                title: 'Invalid date',
                message: 'Bookings are only allowed within the next 2 months.',
                color: 'red',
                autoClose: 5000,
            });
            return;
        }

        const selected = roomClasses
            .filter(r => (quantities[r.id] || 0) > 0)
            .map(r => ({
                id: r.id,
                name: r.name,
                quantity: quantities[r.id],
                pricePerNight: r.basePrice,
                standardCapacity: r.standardCapacity,
                maxCapacity: r.maxCapacity || r.standardCapacity,
                total: quantities[r.id] * r.basePrice * nights,
            }));

        navigate('/user/booking/checkout', {
            state: { checkIn, checkOut, nights, guests, rooms: selected }
        });
    };

    return (
        <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box style={{ backgroundColor: 'var(--mantine-color-blue-9)', color: 'white', padding: '50px 0' }}>
                <Container size="xl">
                    <Title order={1} style={{ fontSize: '28px', fontWeight: 700, color: 'white' }} mb={8}>
                        Book a Room
                    </Title>
                    <Text style={{ fontSize: '16px', opacity: 0.85 }}>
                        Choose the right room type and fill in the booking information
                    </Text>
                </Container>
            </Box>

            <Container size="xl" py={48}>
                <Grid gutter={32}>

                    {/* ── Left: Room table ── */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Card shadow="sm" radius="md" withBorder padding={0} style={{ overflow: 'hidden' }}>
                            {/* Table header */}
                            <Box style={{ backgroundColor: 'var(--mantine-color-blue-9)', padding: '14px 20px' }}>
                                <Group gap="sm">
                                    <IconBuilding size={18} color="var(--mantine-color-blue-3)" />
                                    <Text fw={700} style={{ color: 'white', fontSize: '16px' }}>
                                        ROOM BOOKING
                                    </Text>
                                </Group>
                            </Box>

                            {loading ? (
                                <Center py={80}><Loader color="blue" size="lg" /></Center>
                            ) : (
                                <>
                                    <Table striped highlightOnHover withColumnBorders style={{ fontSize: '14px' }}>
                                        <Table.Thead>
                                            <Table.Tr style={{ backgroundColor: '#f1f3f5' }}>
                                                <Table.Th style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700 }}>
                                                    Room Type
                                                </Table.Th>
                                                <Table.Th style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
                                                    Room Price
                                                </Table.Th>
                                                <Table.Th style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
                                                    Available
                                                </Table.Th>
                                                <Table.Th style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
                                                    Quantity
                                                </Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {roomClasses.map((room) => {
                                                const qty = quantities[room.id] || 0;
                                                const available = room.totalRooms || 0;
                                                const options = Array.from({ length: available + 1 }, (_, i) => ({
                                                    value: String(i),
                                                    label: i === 0 ? '00' : String(i).padStart(2, '0'),
                                                }));

                                                return (
                                                    <Table.Tr
                                                        key={room.id}
                                                        style={{
                                                            backgroundColor: qty > 0 ? 'var(--mantine-color-blue-0)' : undefined,
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        {/* Room name + capacity */}
                                                        <Table.Td style={{ padding: '16px 16px' }}>
                                                            <Text fw={600} style={{ fontSize: '15px', marginBottom: 4 }}>
                                                                {room.name}
                                                            </Text>
                                                            <Group gap={12}>
                                                                <Group gap={4}>
                                                                    <IconUsers size={14} color="#888" />
                                                                    <Text size="xs" c="dimmed">
                                                                        {room.standardCapacity} People
                                                                    </Text>
                                                                </Group>
                                                            </Group>
                                                        </Table.Td>

                                                        {/* Price */}
                                                         <Table.Td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                                            <Text fw={700} color="blue.6" style={{ fontSize: '15px' }}>
                                                                {formatPrice(room.basePrice)}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">VND / night</Text>
                                                        </Table.Td>

                                                        {/* Available */}
                                                        <Table.Td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                                            <Badge
                                                                size="lg"
                                                                variant="light"
                                                                color={available === 0 ? 'red' : available <= 2 ? 'orange' : 'green'}
                                                            >
                                                                {available}
                                                            </Badge>
                                                        </Table.Td>

                                                        {/* Quantity selector */}
                                                         <Table.Td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                                            {available === 0 ? (
                                                                <Text size="sm" c="dimmed">Out of rooms</Text>
                                                            ) : (
                                                                <Select
                                                                    value={String(qty)}
                                                                    onChange={(val) => handleQuantityChange(room.id, val, available)}
                                                                    data={options}
                                                                    style={{ width: '80px', margin: '0 auto' }}
                                                                    allowDeselect={false}
                                                                    styles={{
                                                                        input: {
                                                                            textAlign: 'center',
                                                                            fontWeight: 600,
                                                                            borderColor: qty > 0 ? 'var(--mantine-color-blue-6)' : undefined,
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                );
                                            })}
                                        </Table.Tbody>
                                    </Table>

                                    {/* Total */}
                                    <Box
                                        style={{
                                            padding: '16px 20px',
                                            borderTop: '2px solid #e9ecef',
                                            backgroundColor: totalPrice > 0 ? 'var(--mantine-color-blue-0)' : '#f8f9fa'
                                        }}
                                    >
                                         <Group justify="space-between" align="center">
                                            <Group gap={6}>
                                                <IconCoin size={18} color="blue" />
                                                <Text fw={600} style={{ fontSize: '15px' }}>
                                                    Total Amount:
                                                </Text>
                                            </Group>
                                            <Text fw={800} color="blue.6" style={{ fontSize: '20px' }}>
                                                {totalPrice > 0 ? `${formatPrice(totalPrice)} VND` : '—'}
                                            </Text>
                                        </Group>
                                         {totalPrice > 0 && (
                                            <Text size="xs" c="dimmed" mt={4}>
                                                ({nights} nights × selected rooms ×{' '}room price)
                                            </Text>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Card>
                    </Grid.Col>

                    {/* ── Right: Booking info ── */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card
                            shadow="md"
                            radius="md"
                            padding={0}
                            withBorder
                            style={{ position: 'sticky', top: '24px', overflow: 'hidden' }}
                        >
                            {/* Card header */}
                             <Box style={{ backgroundColor: 'var(--mantine-color-blue-9)', padding: '14px 20px' }}>
                                <Text fw={700} style={{ color: 'white', fontSize: '16px', letterSpacing: '0.5px' }}>
                                    INFORMATION
                                </Text>
                            </Box>

                             <Stack gap="lg" p="xl">
                                {/* Check-in */}
                                <Box>
                                    <Text size="sm" fw={500} mb={6} c="dimmed">Arrival Date:</Text>
                                    <DateTimePicker
                                        value={checkIn}
                                        onChange={(date) => {
                                            if (!date) return;
                                            
                                            const now = dayjs();
                                            let newCheckIn = date;
                                            
                                            // Don't allow selecting more than 5 minutes in the past
                                            if (dayjs(date).isBefore(now.subtract(5, 'minute'))) {
                                                newCheckIn = now.toDate();
                                            }
                                            
                                            setCheckIn(newCheckIn);
                                            
                                            const minCheckOut = getMinimumCheckOut(newCheckIn);
                                            if (!checkOut || dayjs(checkOut).isBefore(minCheckOut)) {
                                                setCheckOut(minCheckOut);
                                            }
                                        }}
                                        minDate={new Date()}
                                        maxDate={dayjs().add(2, 'month').toDate()}
                                        valueFormat="DD/MM/YYYY HH:mm"
                                        leftSection={<IconCalendar size={16} color="blue" />}
                                        styles={{
                                            input: { borderColor: 'var(--mantine-color-blue-6)', fontWeight: 500 },
                                        }}
                                        clearable={false}
                                    />
                                </Box>

                                 {/* Check-out */}
                                <Box>
                                    <Text size="sm" fw={500} mb={6} c="dimmed">Departure Date:</Text>
                                    <DateTimePicker
                                        value={checkOut}
                                        onChange={(date) => {
                                            if (!date) return;
                                            
                                            const minCheckOut = getMinimumCheckOut(checkIn);
                                            if (dayjs(date).isBefore(minCheckOut)) {
                                                setCheckOut(minCheckOut);
                                            } else {
                                                setCheckOut(date);
                                            }
                                        }}
                                        minDate={checkIn ? getMinimumCheckOut(checkIn) : new Date()}
                                        maxDate={dayjs().add(2, 'month').add(1, 'month').toDate()}
                                        valueFormat="DD/MM/YYYY HH:mm"
                                        leftSection={<IconCalendar size={16} color="blue" />}
                                        styles={{
                                            input: { borderColor: 'var(--mantine-color-blue-6)', fontWeight: 500 },
                                        }}
                                        clearable={false}
                                    />
                                </Box>

                                 <Divider />

                                {/* Number of Guests */}
                                <Box>
                                    <Text size="sm" fw={500} mb={6} c="dimmed">Number of Guests:</Text>
                                    <NumberInput
                                        value={guests}
                                        onChange={setGuests}
                                        min={1}
                                        max={999}
                                        leftSection={<IconUsers size={16} color="blue" />}
                                        styles={{ input: { borderColor: 'var(--mantine-color-blue-6)' } }}
                                        clampBehavior="strict"
                                    />
                                </Box>

                                <Divider />

                                {/* Summary box */}
                                {hasSelection && (
                                    <Box
                                        style={{
                                            backgroundColor: 'var(--mantine-color-blue-0)',
                                            borderRadius: 8,
                                            padding: '12px 14px',
                                            border: '1px solid var(--mantine-color-blue-2)'
                                        }}
                                    >
                                         <Text size="sm" fw={600} mb={8}>Selected Rooms:</Text>
                                        <Stack gap={4}>
                                            {roomClasses
                                                .filter(r => (quantities[r.id] || 0) > 0)
                                                .map(r => (
                                                     <Group key={r.id} justify="space-between">
                                                        <Text size="xs" c="dimmed">{r.name} × {quantities[r.id]}</Text>
                                                        <Text size="xs" fw={600} color="blue.6">
                                                            {formatPrice(quantities[r.id] * r.basePrice * nights)} VND
                                                        </Text>
                                                    </Group>
                                                ))}
                                        </Stack>
                                    </Box>
                                )}

                                <Button
                                    fullWidth
                                    size="lg"
                                    disabled={!hasSelection}
                                    onClick={handleContinue}
                                     color="blue"
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        padding: '14px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Continue →
                                </Button>
                                 {!hasSelection && (
                                    <Text size="xs" c="dimmed" ta="center">
                                        Please select at least 1 room to continue
                                    </Text>
                                )}
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            </Container>
        </Box>
    );
}
