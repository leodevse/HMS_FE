import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Container, Divider, Grid, Group, Loader, Modal, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconEdit, IconLogin, IconLogout } from '@tabler/icons-react';
import { reservationApi } from '../../../apis/receptionist/reservationApi';
import { roomClassApi } from '../../../apis/receptionist/roomClassApi';
import { formatUtils } from '../../../utils/formatUtils';

const STATUS_COLORS = { PENDING: 'yellow', IN_HOUSE: 'cyan', CHECKED_OUT: 'green', CANCELLED: 'red' };

export const ReservationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [roomClasses, setRoomClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [occupants, setOccupants] = useState([]);
    const [occupantsLoading, setOccupantsLoading] = useState(false);

    const viewRoomOccupants = async (allocation) => {
        setSelectedAllocation(allocation);
        setOccupants([]);
        setOccupantsLoading(true);
        try {
            setOccupants(await reservationApi.getRoomOccupants(allocation.id));
        } catch (error) {
            notifications.show({
                color: 'red',
                title: 'Không thể tải khách lưu trú',
                message: error?.response?.data?.message || error.message,
            });
        } finally {
            setOccupantsLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [detail, classes] = await Promise.all([
                    reservationApi.getReservationById(id),
                    roomClassApi.getAll(),
                ]);
                if (mounted) {
                    setReservation(detail);
                    setRoomClasses(classes);
                }
            } catch (error) {
                notifications.show({
                    color: 'red',
                    title: 'Không thể tải reservation',
                    message: error?.response?.data?.message || error.message,
                });
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    if (loading) return <Container py={80} ta="center"><Loader /><Text mt="md">Đang tải thông tin đặt phòng...</Text></Container>;
    if (!reservation) return <Container py={80} ta="center"><Text c="red">Không tìm thấy reservation.</Text></Container>;

    const className = (classId) => roomClasses.find((item) => Number(item.id) === Number(classId))?.name || `Room Class #${classId}`;

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <Group>
                    <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate(-1)}>Quay lại</Button>
                    <Title order={2}>Reservation Detail</Title>
                </Group>
                <Badge size="xl" color={STATUS_COLORS[reservation.status] || 'gray'}>{reservation.status}</Badge>
            </Group>

            <Stack gap="lg">
                <Card withBorder radius="lg" p="xl">
                    <Grid gutter="xl">
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Booking code</Text><Text fw={700}>{reservation.bookingCode}</Text></Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Customer</Text><Text fw={700}>{reservation.customer?.fullName || '-'}</Text></Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Email</Text><Text fw={700}>{reservation.customer?.username || reservation.customer?.email || '-'}</Text></Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Check-in</Text><Text fw={600}>{formatUtils.formatDate(reservation.checkInDate, true)}</Text></Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Check-out</Text><Text fw={600}>{formatUtils.formatDate(reservation.checkOutDate, true)}</Text></Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}><Text c="dimmed" size="sm">Total rooms</Text><Text fw={600}>{reservation.allocations?.length || 0}</Text></Grid.Col>
                    </Grid>
                </Card>

                <Card withBorder radius="lg" p="xl">
                    <Title order={4} mb="md">Assigned rooms</Title>
                    <Table striped withTableBorder>
                        <Table.Thead><Table.Tr><Table.Th>#</Table.Th><Table.Th>Room</Table.Th><Table.Th>Room Class</Table.Th><Table.Th>Check-in</Table.Th><Table.Th>Check-out</Table.Th></Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {(reservation.allocations || []).map((allocation, index) => (
                                <Table.Tr key={allocation.id}>
                                    <Table.Td>{index + 1}</Table.Td>
                                    <Table.Td>
                                        <Button
                                            variant="subtle"
                                            size="compact-sm"
                                            px={4}
                                            fw={700}
                                            onClick={() => viewRoomOccupants(allocation)}
                                        >
                                            {allocation.roomNumber}
                                        </Button>
                                    </Table.Td>
                                    <Table.Td>{className(allocation.roomClassId)}</Table.Td>
                                    <Table.Td>{formatUtils.formatDate(allocation.checkInDate)}</Table.Td>
                                    <Table.Td>{formatUtils.formatDate(allocation.checkOutDate)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>

                {reservation.status === 'PENDING' && (
                    <Group justify="flex-end">
                        <Button variant="outline" leftSection={<IconEdit size={17} />} onClick={() => navigate(`/receptionist/reservations/${id}/edit`)}>Edit</Button>
                        <Button leftSection={<IconLogin size={17} />} onClick={() => navigate(`/receptionist/reservations/${id}/check-in`)}>Check-in</Button>
                    </Group>
                )}
                {reservation.status === 'IN_HOUSE' && (
                    <Group justify="flex-end">
                        <Button color="green" leftSection={<IconLogout size={17} />} onClick={() => navigate(`/receptionist/reservations/${id}/check-out`)}>Payment & Check-out</Button>
                    </Group>
                )}
            </Stack>

            <Modal
                opened={Boolean(selectedAllocation)}
                onClose={() => setSelectedAllocation(null)}
                title={selectedAllocation ? `Occupants of room ${selectedAllocation.roomNumber}` : 'Room occupants'}
                centered
                size="lg"
                radius="md"
            >
                {selectedAllocation && (
                    <Stack gap="md">
                        <SimpleGrid cols={{base: 1, sm: 3}}>
                            <div><Text size="xs" c="dimmed">Room class</Text><Text fw={600}>{className(selectedAllocation.roomClassId)}</Text></div>
                            <div><Text size="xs" c="dimmed">Check-in</Text><Text fw={600}>{formatUtils.formatDate(selectedAllocation.checkInDate)}</Text></div>
                            <div><Text size="xs" c="dimmed">Check-out</Text><Text fw={600}>{formatUtils.formatDate(selectedAllocation.checkOutDate)}</Text></div>
                        </SimpleGrid>
                        <Divider label={`Registered occupants (${occupants.length})`} labelPosition="left"/>
                        {occupantsLoading ? (
                            <Group justify="center" py="lg"><Loader size="sm"/><Text c="dimmed">Loading occupants...</Text></Group>
                        ) : occupants.length > 0 ? (
                            occupants.map((guest, index) => (
                                <Paper key={guest.id} p="md" withBorder radius="md" bg="gray.0">
                                    <Text fw={700} mb="xs">Guest {index + 1}: {guest.guestName}</Text>
                                    <SimpleGrid cols={{base: 1, sm: 2}} spacing="xs">
                                        <Text size="sm"><b>Phone:</b> {guest.phoneNumber || '-'}</Text>
                                        <Text size="sm"><b>ID/Passport:</b> {guest.identityDocument || '-'}</Text>
                                    </SimpleGrid>
                                    <Text size="sm" mt="xs"><b>Residence:</b> {guest.residence || '-'}</Text>
                                </Paper>
                            ))
                        ) : (
                            <Text c="dimmed" ta="center" py="lg">
                                No occupant information has been registered for this room.
                            </Text>
                        )}
                    </Stack>
                )}
            </Modal>
        </Container>
    );
};
