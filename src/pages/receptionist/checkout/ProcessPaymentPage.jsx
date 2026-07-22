import {useCallback, useEffect, useRef, useState} from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Group,
    Loader,
    Select,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import {useNavigate, useParams} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {paymentApi} from '../../../apis/receptionist/paymentApi';

const fmt = (v) => `${Number(v || 0).toLocaleString('vi-VN')}`;
const fmtVND = (v) => `${Number(v || 0).toLocaleString('vi-VN')} VND`;

const fmtDate = (v) => {
    if (!v) return '-';
    try {
        return new Date(v).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
    } catch {
        return v;
    }
};
const fmtDateTime = (v) => {
    if (!v) return '-';
    try {
        const d = new Date(v);
        return `${fmtDate(v)} ${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}`;
    } catch {
        return v;
    }
};

const PAYMENT_METHODS = [
    {value: 'CASH', label: 'Cash'},
    {value: 'CARD', label: 'Card'},
];

export const ProcessPaymentPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const initialLoadStarted = useRef(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await paymentApi.getCheckoutSummary(id);
            setSummary(data);
            // Select all items by default
            const initSelected = {};
            (data.items || []).forEach((item, idx) => {
                initSelected[idx] = true;
            });
            setSelectedItems(initSelected);
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot load payment', message: error?.response?.data?.message || error.message});
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (initialLoadStarted.current) return;
        initialLoadStarted.current = true;
        load();
    }, [load]);

    const folioItems = summary?.items || [];
    const selectedTotal = folioItems.reduce((sum, item, idx) =>
        sum + (selectedItems[idx] ? Number(item.amount || 0) : 0), 0
    );
    const totalPaid = Number(summary?.totalPaid || 0);
    const outstandingBalance = Math.max(0, Number(summary?.balance || 0));
    const amountToPay = Math.min(outstandingBalance, selectedTotal);

    const toggleItem = (idx) => {
        setSelectedItems(prev => ({...prev, [idx]: !prev[idx]}));
    };

    const handleExecuteTrade = async () => {
        if (amountToPay <= 0) return;
        setSubmitting(true);
        try {
            await paymentApi.recordPayment({
                folioId: summary.folioId,
                amount: amountToPay,
                paymentMethod,
            });
            notifications.show({color: 'green', title: 'Payment successful', message: `${fmtVND(amountToPay)} recorded.`});
            navigate(`/receptionist/reservations/${id}/check-out`);
        } catch (error) {
            notifications.show({color: 'red', title: 'Payment failed', message: error?.response?.data?.message || error.message});
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <Box style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300}}>
            <Loader/>
        </Box>
    );
    if (!summary) return (
        <Box style={{textAlign: 'center', padding: '60px 0'}}>
            <Text c="red">Payment information is unavailable.</Text>
        </Box>
    );

    return (
        <Box p="xl" maw={1100} mx="auto">
            <Title order={1} ta="center" mb="xl">Process Payment</Title>

            {/* Reservation Information */}
            <Card withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">Reservation Information</Title>
                <Box style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px'}}>
                    <Text size="sm"><b>Room:</b></Text>
                    <Text size="sm"><b>Owner:</b></Text>
                    <Text size="sm"><b>Identity ID:</b></Text>

                    <Text size="sm">{summary.roomNumber || '-'}</Text>
                    <Text size="sm">{summary.customerName || summary.customer?.fullName || `Customer #${summary.customerId}`}</Text>
                    <Text size="sm">{summary.identityCard || summary.customer?.identityCard || '-'}</Text>

                    <Text size="sm"><b>Check-in:</b></Text>
                    <Text size="sm"><b>Actual Check-in Time:</b></Text>
                    <Box/>

                    <Text size="sm">{fmtDateTime(summary.checkInDate)}</Text>
                    <Text size="sm" component="div">
                        <Group gap={6} wrap="nowrap">
                            <span>{fmtDateTime(summary.actualCheckInTime || summary.checkInDate)}</span>
                            <Badge size="xs" color="green" variant="light">Valid</Badge>
                        </Group>
                    </Text>
                    <Box/>

                    <Text size="sm"><b>Check-out:</b></Text>
                    <Text size="sm"><b>Current Time:</b></Text>
                    <Box/>

                    <Text size="sm">{fmtDateTime(summary.checkOutDate)}</Text>
                    <Text size="sm" component="div">
                        <Group gap={6} wrap="nowrap">
                            <span>{fmtDateTime(new Date().toISOString())}</span>
                            <Badge size="xs" color="orange" variant="light">Late Check-out</Badge>
                        </Group>
                    </Text>
                    <Box/>
                </Box>
            </Card>

            {/* Folio Details */}
            <Card withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">Folio Details</Title>
                <Box style={{overflowX: 'auto'}}>
                    <Table withTableBorder withColumnBorders verticalSpacing="xs" horizontalSpacing="sm">
                        <Table.Thead style={{backgroundColor: '#f8f9fa'}}>
                            <Table.Tr>
                                <Table.Th style={{width: 50}}>Select</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th ta="right">Amount (VND)</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {folioItems.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text ta="center" c="dimmed" py="md">No charges found.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : folioItems.map((item, idx) => (
                                <Table.Tr key={idx}>
                                    <Table.Td ta="center">
                                        <Checkbox
                                            checked={!!selectedItems[idx]}
                                            onChange={() => toggleItem(idx)}
                                        />
                                    </Table.Td>
                                    <Table.Td>{fmtDate(item.date || item.createdAt)}</Table.Td>
                                    <Table.Td>{item.itemType || item.category || '-'}</Table.Td>
                                    <Table.Td>{item.description || item.referenceKey || `Charge #${item.id}`}</Table.Td>
                                    <Table.Td ta="right" fw={500}>{fmt(item.amount)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
            </Card>

            {/* Existing payment information */}
            <Card withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">Payment Status</Title>
                <Stack gap="xs">
                    <Group>
                        <Text size="sm" w={180}><b>Total already paid:</b></Text>
                        <Text size="sm">{fmtVND(totalPaid)}</Text>
                    </Group>
                    <Group>
                        <Text size="sm" w={180}><b>Outstanding balance:</b></Text>
                        <Text size="sm" fw={700} c={outstandingBalance > 0 ? 'red' : 'green'}>
                            {fmtVND(outstandingBalance)}
                        </Text>
                    </Group>
                </Stack>
            </Card>

            {/* Summary */}
            <Card withBorder radius="md" p="lg" mb="xl">
                <Title order={4} mb="md">Summary</Title>
                <Stack gap="xs">
                    <Group justify="space-between" maw={400}>
                        <Text size="sm">Total Charges:</Text>
                        <Text size="sm" fw={500}>{fmtVND(selectedTotal)}</Text>
                    </Group>
                    <Group justify="space-between" maw={400}>
                        <Text size="sm">Already Paid:</Text>
                        <Text size="sm" fw={500}>{fmtVND(totalPaid)}</Text>
                    </Group>
                    <Divider maw={400}/>
                    <Group justify="space-between" maw={400}>
                        <Text size="sm" fw={700}>Amount To Pay:</Text>
                        <Text size="sm" fw={700} c={amountToPay > 0 ? 'red' : 'green'}>{fmtVND(amountToPay)}</Text>
                    </Group>
                </Stack>
            </Card>

            {/* Footer */}
            <Divider mb="md"/>
            <Group justify="space-between" align="center">
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Group align="center">
                    <Text size="sm" fw={500}>Payment Method:</Text>
                    <Select
                        data={PAYMENT_METHODS}
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        style={{width: 160}}
                        size="sm"
                    />
                    <Button
                        color="blue"
                        loading={submitting}
                        onClick={handleExecuteTrade}
                        disabled={amountToPay <= 0}
                    >
                        Execute Trade
                    </Button>
                </Group>
            </Group>
        </Box>
    );
};
