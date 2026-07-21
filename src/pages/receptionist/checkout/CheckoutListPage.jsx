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
            const [inHousePage, checkedOutPage] = await Promise.all([
                reservationApi.getReservations({status: 'IN_HOUSE', size: 100}),
                reservationApi.getReservations({status: 'CHECKED_OUT', size: 100}),
            ]);
            setReservations([...(inHousePage.content || []), ...(checkedOutPage.content || [])]
                .sort((a, b) => Number(b.bookingId) - Number(a.bookingId)));
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot load check-outs', message: error?.response?.data?.message || error.message});
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);

    return <Container size="xl" py="xl">
        <Group justify="space-between" mb="xl"><div><Title order={2}>Check-out & Payment History</Title><Text c="dimmed">Settle in-house reservations and reopen completed invoices.</Text></div><Button variant="light" onClick={load}>Refresh</Button></Group>
        <Paper withBorder radius="lg" p="md">
            {loading ? <Group justify="center" py="xl"><Loader/></Group> : <Table highlightOnHover>
                <Table.Thead><Table.Tr><Table.Th>Booking code</Table.Th><Table.Th>Customer</Table.Th><Table.Th>Check-in</Table.Th><Table.Th>Check-out</Table.Th><Table.Th>Status</Table.Th><Table.Th/></Table.Tr></Table.Thead>
                <Table.Tbody>{reservations.map((item) => <Table.Tr key={item.bookingId}>
                    <Table.Td fw={700}>{item.bookingCode}</Table.Td><Table.Td>{item.customer?.fullName || `Customer #${item.customerId}`}</Table.Td>
                    <Table.Td>{formatUtils.formatDate(item.checkInDate, true)}</Table.Td><Table.Td>{formatUtils.formatDate(item.checkOutDate, true)}</Table.Td>
                    <Table.Td><Badge color={item.status === 'CHECKED_OUT' ? 'green' : 'cyan'}>{item.status === 'CHECKED_OUT' ? 'CHECKED OUT' : 'IN HOUSE'}</Badge></Table.Td>
                    <Table.Td><Button size="xs" variant={item.status === 'CHECKED_OUT' ? 'light' : 'filled'} leftSection={<IconReceipt size={16}/>} onClick={() => navigate(`/receptionist/reservations/${item.bookingId}/check-out`)}>{item.status === 'CHECKED_OUT' ? 'View invoice' : 'Open folio'}</Button></Table.Td>
                </Table.Tr>)}</Table.Tbody>
            </Table>}
            {!loading && reservations.length === 0 && <Text c="dimmed" ta="center" py="xl">No folio or completed invoice was found.</Text>}
        </Paper>
    </Container>;
};
