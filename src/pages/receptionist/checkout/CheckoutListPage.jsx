import {useCallback, useEffect, useState} from 'react';
import {Badge, Button, Container, Group, Loader, Paper, Stack, Table, Text, Title} from '@mantine/core';
import {IconReceipt} from '@tabler/icons-react';
import {useNavigate} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {reservationApi} from '../../../apis/receptionist/reservationApi';
import {formatUtils} from '../../../utils/formatUtils';

export const CheckoutListPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const page = await reservationApi.getReservations({status: 'IN_HOUSE', size: 100});
            setReservations(page.content || []);
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot load check-outs', message: error?.response?.data?.message || error.message});
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    return <Container size="xl" py="xl">
        <Group justify="space-between" mb="xl"><div><Title order={2}>Check-out & Payment</Title><Text c="dimmed">In-house reservations waiting for settlement and check-out.</Text></div><Button variant="light" onClick={load}>Refresh</Button></Group>
        <Paper withBorder radius="lg" p="md">
            {loading ? <Group justify="center" py="xl"><Loader/></Group> : <Table highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>Booking code</Table.Th><Table.Th>Customer</Table.Th><Table.Th>Check-in</Table.Th><Table.Th>Check-out</Table.Th><Table.Th>Status</Table.Th><Table.Th/></Table.Tr></Table.Thead>
                <Table.Tbody>{reservations.map((item) => <Table.Tr key={item.bookingId}>
                    <Table.Td fw={700}>{item.bookingCode}</Table.Td><Table.Td>{item.customer?.fullName || `Customer #${item.customerId}`}</Table.Td>
                    <Table.Td>{formatUtils.formatDate(item.checkInDate, true)}</Table.Td><Table.Td>{formatUtils.formatDate(item.checkOutDate, true)}</Table.Td>
                    <Table.Td><Badge color="cyan">IN HOUSE</Badge></Table.Td>
                    <Table.Td><Button size="xs" leftSection={<IconReceipt size={16}/>} onClick={() => navigate(`/receptionist/reservations/${item.bookingId}/check-out`)}>Open folio</Button></Table.Td>
                </Table.Tr>)}</Table.Tbody>
            </Table>}
            {!loading && reservations.length === 0 && <Text c="dimmed" ta="center" py="xl">No in-house reservation is waiting for check-out.</Text>}
        </Paper>
    </Container>;
};
