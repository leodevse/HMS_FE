import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Badge, Button, Card, Container, Divider, Grid, Group, Loader, NumberInput, Select, Stack, Table, Text, Title} from '@mantine/core';
import {IconArrowLeft, IconCash, IconLogout, IconPrinter} from '@tabler/icons-react';
import {useNavigate, useParams} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {paymentApi} from '../../../apis/receptionist/paymentApi';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

export const CheckoutPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [method, setMethod] = useState('CASH');
    const [amount, setAmount] = useState(0);
    const initialLoadStarted = useRef(false);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await paymentApi.getCheckoutSummary(id);
            setSummary(data); setAmount(Math.max(0, Number(data.balance || 0)));
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot prepare checkout', message: error?.response?.data?.message || error.message});
        } finally { setLoading(false); }
    }, [id]);
    useEffect(() => {
        if (initialLoadStarted.current) return;
        initialLoadStarted.current = true;
        load();
    }, [load]);
    const balance = Number(summary?.balance || 0);
    const canPay = useMemo(() => amount > 0 && amount <= balance, [amount, balance]);

    const pay = async () => {
        setSubmitting(true);
        try {
            await paymentApi.recordPayment({folioId: summary.folioId, amount, paymentMethod: method});
            notifications.show({color: 'green', title: 'Payment recorded', message: `${money(amount)} received.`});
            await load();
        } catch (error) { notifications.show({color: 'red', title: 'Payment failed', message: error?.response?.data?.message || error.message}); }
        finally { setSubmitting(false); }
    };
    const finalize = async () => {
        setSubmitting(true);
        try {
            await paymentApi.finalizeCheckout(id);
            notifications.show({color: 'green', title: 'Check-out completed', message: 'The reservation and assigned rooms were checked out successfully.'});
            navigate('/receptionist/payment');
        } catch (error) { notifications.show({color: 'red', title: 'Cannot check out', message: error?.response?.data?.message || error.message}); }
        finally { setSubmitting(false); }
    };

    if (loading) return <Container py={80}><Group justify="center"><Loader/></Group></Container>;
    if (!summary) return <Container py={80}><Text c="red" ta="center">Checkout summary is unavailable.</Text></Container>;
    return <Container size="lg" py="xl"><Stack gap="lg">
        <Group justify="space-between"><Group><Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} onClick={() => navigate(-1)}>Back</Button><div><Title order={2}>{summary.bookingStatus === 'CHECKED_OUT' ? 'Invoice' : 'Guest folio & Check-out'}</Title><Text c="dimmed">{summary.bookingCode}</Text></div></Group><Group><Button variant="light" leftSection={<IconPrinter size={16}/>} onClick={() => window.print()}>Print invoice</Button><Badge size="xl" color={summary.bookingStatus === 'CHECKED_OUT' ? 'green' : 'cyan'}>{summary.bookingStatus}</Badge></Group></Group>
        <Card withBorder radius="lg" p="xl"><Grid><Grid.Col span={4}><Text c="dimmed" size="sm">Customer</Text><Text fw={700}>Customer #{summary.customerId}</Text></Grid.Col><Grid.Col span={4}><Text c="dimmed" size="sm">Stay</Text><Text fw={700}>{summary.nights} night(s)</Text></Grid.Col><Grid.Col span={4}><Text c="dimmed" size="sm">Folio</Text><Text fw={700}>#{summary.folioId}</Text></Grid.Col></Grid></Card>
        <Card withBorder radius="lg" p="xl"><Title order={4} mb="md">Charges</Title><Table striped><Table.Thead><Table.Tr><Table.Th>Description</Table.Th><Table.Th>Type</Table.Th><Table.Th ta="right">Amount</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{(summary.items || []).map(item => <Table.Tr key={item.id}><Table.Td>{item.description || item.referenceKey || `Charge #${item.id}`}</Table.Td><Table.Td><Badge variant="light">{item.itemType}</Badge></Table.Td><Table.Td ta="right">{money(item.amount)}</Table.Td></Table.Tr>)}</Table.Tbody></Table><Divider my="md"/><Stack gap={6} align="flex-end"><Text>Total charges: <b>{money(summary.totalCharges)}</b></Text><Text>Total paid: <b>{money(summary.totalPaid)}</b></Text><Title order={3} c={balance > 0 ? 'red' : 'green'}>Balance: {money(balance)}</Title></Stack></Card>
        <Card withBorder radius="lg" p="xl"><Title order={4} mb="md">Payment transactions</Title>{(summary.payments || []).length ? <Table striped><Table.Thead><Table.Tr><Table.Th>Transaction</Table.Th><Table.Th>Method</Table.Th><Table.Th>Date</Table.Th><Table.Th ta="right">Amount</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{summary.payments.map(payment => <Table.Tr key={payment.id}><Table.Td>#{payment.id} · {payment.transactionType}</Table.Td><Table.Td><Badge variant="light">{payment.paymentMethod}</Badge></Table.Td><Table.Td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : '-'}</Table.Td><Table.Td ta="right">{money(payment.amount)}</Table.Td></Table.Tr>)}</Table.Tbody></Table> : <Text c="dimmed">No payment has been recorded.</Text>}</Card>
        {summary.bookingStatus === 'IN_HOUSE' && <Card withBorder radius="lg" p="xl"><Title order={4} mb="md">Settlement</Title><Grid align="end"><Grid.Col span={{base: 12, sm: 4}}><Select label="Payment method" data={[{value:'CASH',label:'Cash'},{value:'CARD',label:'Card'}]} value={method} onChange={setMethod}/></Grid.Col><Grid.Col span={{base: 12, sm: 4}}><NumberInput label="Amount" min={0} max={Math.max(0,balance)} value={amount} onChange={setAmount} thousandSeparator="," suffix=" ₫"/></Grid.Col><Grid.Col span={{base: 12, sm: 4}}><Button fullWidth leftSection={<IconCash size={17}/>} disabled={!canPay} loading={submitting} onClick={pay}>Record payment</Button></Grid.Col></Grid><Divider my="lg"/><Group justify="flex-end"><Button color="green" size="md" leftSection={<IconLogout size={18}/>} disabled={balance !== 0} loading={submitting} onClick={finalize}>Confirm check-out</Button></Group>{balance > 0 && <Text c="dimmed" size="sm" ta="right" mt="xs">Pay the full outstanding balance before check-out.</Text>}</Card>}
    </Stack></Container>;
};
