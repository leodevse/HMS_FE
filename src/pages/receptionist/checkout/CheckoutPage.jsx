import {useCallback, useEffect, useRef, useState} from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Loader,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import {IconPlus, IconTrash, IconEdit} from '@tabler/icons-react';
import {useNavigate, useParams} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {paymentApi} from '../../../apis/receptionist/paymentApi';

const fmt = (v) => `${Number(v || 0).toLocaleString('vi-VN')}`;
const fmtLabel = (v) => `${Number(v || 0).toLocaleString('vi-VN')} VND`;
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

const CATEGORY_OPTIONS = [
    {value: 'ROOM_CHARGE', label: 'Room Charge'},
    {value: 'SURCHARGE', label: 'Surcharge'},
    {value: 'MINIBAR', label: 'Minibar'},
    {value: 'LAUNDRY', label: 'Laundry'},
    {value: 'RESTAURANT', label: 'Restaurant'},
    {value: 'OTHER', label: 'Other'},
];

function AddChargeModal({opened, onClose, onAdd}) {
    const [category, setCategory] = useState('OTHER');
    const [description, setDescription] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState(0);

    const handleAdd = () => {
        if (!description.trim() || price <= 0) {
            notifications.show({color: 'red', message: 'Please fill description and price.'});
            return;
        }
        onAdd({category, description, qty: Number(qty), price: Number(price), total: Number(qty) * Number(price)});
        setDescription(''); setQty(1); setPrice(0); setCategory('OTHER');
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Add Service Charge" centered size="md">
            <Stack>
                <Select label="Category" data={CATEGORY_OPTIONS} value={category} onChange={setCategory}/>
                <TextInput label="Description" placeholder="e.g. Extra Towel" value={description}
                           onChange={(e) => setDescription(e.target.value)}/>
                <Group grow>
                    <NumberInput label="Qty" min={1} value={qty} onChange={setQty}/>
                    <NumberInput label="Price (VND)" min={0} value={price} onChange={setPrice}
                                 thousandSeparator="," />
                </Group>
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Charge</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export const CheckoutPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [extraCharges, setExtraCharges] = useState([]);
    const [editingIdx, setEditingIdx] = useState(null);
    const initialLoadStarted = useRef(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await paymentApi.getCheckoutSummary(id);
            setSummary(data);
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot prepare checkout', message: error?.response?.data?.message || error.message});
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
    const allItems = [...folioItems.map(item => ({
        date: item.date || item.createdAt,
        category: item.itemType || item.category || 'Room Charge',
        description: item.description || item.referenceKey || `Charge #${item.id}`,
        qty: item.qty ?? 1,
        price: item.unitPrice ?? item.amount,
        total: item.amount,
        fromApi: true,
        id: item.id,
    })), ...extraCharges];

    const totalCharges = allItems.reduce((sum, i) => sum + Number(i.total || 0), 0);

    const handleRemoveExtra = (idx) => {
        setExtraCharges(prev => prev.filter((_, i) => i !== idx));
    };

    const finalize = async () => {
        setSubmitting(true);
        try {
            await paymentApi.finalizeCheckout(id);
            notifications.show({color: 'green', title: 'Check-out completed', message: 'Reservation checked out successfully.'});
            navigate('/receptionist/payment');
        } catch (error) {
            notifications.show({color: 'red', title: 'Cannot check out', message: error?.response?.data?.message || error.message});
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
            <Text c="red">Checkout summary is unavailable.</Text>
        </Box>
    );

    const isCheckedOut = summary.bookingStatus === 'CHECKED_OUT';
    const balance = Number(summary.balance || 0);

    return (
        <Box p="xl" maw={1100} mx="auto">
            <Title order={1} ta="center" mb="xl">Check-out</Title>

            {/* Reservation Information */}
            <Card withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">Reservation Information</Title>
                <Box style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px'}}>
                    <Text size="sm"><b>Room:</b></Text>
                    <Text size="sm"><b>Owner:</b></Text>
                    <Text size="sm"><b>Identity ID:</b></Text>

                    <Text size="sm">{summary.roomNumber || summary.rooms?.join(', ') || '-'}</Text>
                    <Text size="sm">{summary.customerName || summary.customer?.fullName || `Customer #${summary.customerId}`}</Text>
                    <Text size="sm">{summary.identityCard || summary.customer?.identityCard || '-'}</Text>

                    <Text size="sm"><b>Check-in:</b></Text>
                    <Text size="sm"><b>Actual Check-in Time:</b></Text>
                    <Box/>

                    <Text size="sm">{fmtDateTime(summary.checkInDate)}</Text>
                    <Text size="sm">
                        {fmtDateTime(summary.actualCheckInTime || summary.checkInDate)}
                        {' '}
                        <Badge size="xs" color="green" variant="light">Valid</Badge>
                    </Text>
                    <Box/>

                    <Text size="sm"><b>Check-out:</b></Text>
                    <Text size="sm"><b>Current Time:</b></Text>
                    <Box/>

                    <Text size="sm">{fmtDateTime(summary.checkOutDate)}</Text>
                    <Text size="sm">
                        {fmtDateTime(new Date().toISOString())}
                        {' '}
                        <Badge size="xs" color="orange" variant="light">Late Check-out</Badge>
                    </Text>
                    <Box style={{display: 'flex', alignItems: 'center'}}>
                        <Button size="xs" variant="outline">Scan Identity Card</Button>
                    </Box>
                </Box>
            </Card>

            {/* Folio Details */}
            <Card withBorder radius="md" p="lg" mb="md">
                <Title order={4} mb="md">Folio Details</Title>
                <Box style={{overflowX: 'auto'}}>
                    <Table withBorder withColumnBorders verticalSpacing="xs" horizontalSpacing="sm">
                        <Table.Thead style={{backgroundColor: '#f8f9fa'}}>
                            <Table.Tr>
                                <Table.Th style={{width: 40}}>STT</Table.Th>
                                <Table.Th>Date</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th style={{width: 60}}>Qty</Table.Th>
                                <Table.Th>Price</Table.Th>
                                <Table.Th>Total</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allItems.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={8}>
                                        <Text ta="center" c="dimmed" py="md">No charges found.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ) : allItems.map((item, idx) => (
                                <Table.Tr key={idx}>
                                    <Table.Td>{idx + 1}</Table.Td>
                                    <Table.Td>{fmtDate(item.date)}</Table.Td>
                                    <Table.Td>{item.category}</Table.Td>
                                    <Table.Td>{item.description}</Table.Td>
                                    <Table.Td ta="center">{item.qty ?? 1}</Table.Td>
                                    <Table.Td>{item.price != null ? fmt(item.price) + 'k' : '-'}</Table.Td>
                                    <Table.Td fw={500}>{fmt(item.total)}</Table.Td>
                                    <Table.Td>
                                        {!item.fromApi && (
                                            <Group gap={4} wrap="nowrap">
                                                <Button size="compact-xs" variant="outline"
                                                        onClick={() => setEditingIdx(idx - folioItems.length)}>
                                                    <IconEdit size={12}/> Edit
                                                </Button>
                                                <Button size="compact-xs" color="red" variant="outline"
                                                        onClick={() => handleRemoveExtra(idx - folioItems.length)}>
                                                    <IconTrash size={12}/> Delete
                                                </Button>
                                            </Group>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
                <Box mt="md">
                    <Button
                        size="sm"
                        variant="outline"
                        leftSection={<IconPlus size={14}/>}
                        onClick={() => setAddModalOpen(true)}
                        disabled={isCheckedOut}
                    >
                        Add Service Charge
                    </Button>
                </Box>
            </Card>

            {/* Summary */}
            <Card withBorder radius="md" p="lg" mb="xl">
                <Title order={4} mb="md">Summary</Title>
                <Text size="sm">
                    <b>Total Charges:</b>{' '}
                    <b style={{fontSize: 16}}>{fmtLabel(totalCharges)}</b>
                </Text>
                {balance > 0 && (
                    <Text size="sm" c="red" mt={4}>
                        Outstanding balance: {fmtLabel(balance)}
                    </Text>
                )}
            </Card>

            {/* Footer buttons */}
            <Divider mb="md"/>
            <Group justify="space-between">
                <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Button
                    color="blue"
                    loading={submitting}
                    disabled={isCheckedOut || balance > 0}
                    onClick={finalize}
                >
                    Confirm Check-out
                </Button>
            </Group>

            <AddChargeModal
                opened={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onAdd={(charge) => setExtraCharges(prev => [...prev, charge])}
            />
        </Box>
    );
};
