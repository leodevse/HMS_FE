import { useState, useEffect } from 'react';
import {
    Table, Badge, Pagination, Group, Text, LoadingOverlay,
    TextInput, Select, Grid, Button
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { transactionApi } from '../../../apis/admin/transactionApi';

export function TransactionTab() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // Filters
    const [searchCode, setSearchCode] = useState('');
    const [searchFolioId, setSearchFolioId] = useState('');
    const [filterMethod, setFilterMethod] = useState(null);
    const [filterType, setFilterType] = useState(null);
    const [filterStatus, setFilterStatus] = useState(null);

    const [debouncedCode] = useDebouncedValue(searchCode, 500);
    const [debouncedFolioId] = useDebouncedValue(searchFolioId, 500);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: 6,
                code: debouncedCode || undefined,
                folioId: debouncedFolioId ? Number(debouncedFolioId) : undefined,
                paymentMethod: filterMethod || undefined,
                type: filterType || undefined,
                status: filterStatus || undefined
            };
            const res = await transactionApi.getAllTransactions(params);
            setTransactions(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Tải danh sách giao dịch thất bại', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, debouncedCode, debouncedFolioId, filterMethod, filterType, filterStatus]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderStatus = (status) => {
        const colors = { SUCCESS: 'green', PENDING: 'orange', FAILED: 'red' };
        return <Badge color={colors[status] || 'gray'}>{status}</Badge>;
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} />

            <Grid mb="md" align="flex-end">
                <Grid.Col span={{ base: 12, sm: 4, md: 3 }}>
                    <TextInput
                        label="Mã giao dịch"
                        placeholder="Nhập mã..."
                        leftSection={<IconSearch size={16} />}
                        value={searchCode}
                        onChange={(e) => { setSearchCode(e.currentTarget.value); setPage(1); }}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
                    <TextInput
                        label="Folio ID"
                        placeholder="ID..."
                        value={searchFolioId}
                        onChange={(e) => { setSearchFolioId(e.currentTarget.value); setPage(1); }}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
                    <Select
                        label="Phương thức"
                        placeholder="Tất cả"
                        data={['VNPAY', 'CASH', 'CREDIT_CARD', 'BANK_TRANSFER']}
                        value={filterMethod}
                        onChange={(val) => { setFilterMethod(val); setPage(1); }}
                        clearable
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
                    <Select
                        label="Loại GD"
                        placeholder="Tất cả"
                        data={['PAYMENT', 'REFUND', 'DEPOSIT']}
                        value={filterType}
                        onChange={(val) => { setFilterType(val); setPage(1); }}
                        clearable
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4, md: 2 }}>
                    <Select
                        label="Trạng thái"
                        placeholder="Tất cả"
                        data={['SUCCESS', 'PENDING', 'FAILED']}
                        value={filterStatus}
                        onChange={(val) => { setFilterStatus(val); setPage(1); }}
                        clearable
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4, md: 1 }}>
                    <Button variant="light" color="gray" fullWidth onClick={() => {
                        setSearchCode(''); setSearchFolioId(''); setFilterMethod(null); setFilterType(null); setFilterStatus(null); setPage(1);
                    }}>Xóa</Button>
                </Grid.Col>
            </Grid>

            <Group justify="flex-end" mb="sm">
                <Text size="sm" c="dimmed" fw={500}>Tìm thấy: {totalElements} giao dịch</Text>
            </Group>

            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Folio ID</Table.Th>
                        <Table.Th>Mã Giao dịch (Code)</Table.Th>
                        <Table.Th>Phương thức</Table.Th>
                        <Table.Th>Loại</Table.Th>
                        <Table.Th>Số tiền</Table.Th>
                        <Table.Th>Trạng thái</Table.Th>
                        <Table.Th>Ngày tạo</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {transactions.length > 0 ? transactions.map((tx) => (
                        <Table.Tr key={tx.id}>
                            <Table.Td>{tx.id}</Table.Td>
                            <Table.Td>{tx.folioId}</Table.Td>
                            <Table.Td fw={600}>{tx.code}</Table.Td>
                            <Table.Td><Badge variant="outline">{tx.paymentMethod}</Badge></Table.Td>
                            <Table.Td><Badge color="blue" variant="light">{tx.type}</Badge></Table.Td>
                            <Table.Td fw={600} c={tx.type === 'REFUND' ? 'red' : 'green'}>
                                {tx.type === 'REFUND' ? '-' : '+'}{formatCurrency(tx.amount)}
                            </Table.Td>
                            <Table.Td>{renderStatus(tx.status)}</Table.Td>
                            <Table.Td>{new Date(tx.createdAt).toLocaleString('vi-VN')}</Table.Td>
                        </Table.Tr>
                    )) : (
                        <Table.Tr><Table.Td colSpan={8} ta="center" py="xl"><Text c="dimmed">Không có dữ liệu</Text></Table.Td></Table.Tr>
                    )}
                </Table.Tbody>
            </Table>

            {totalPages > 1 && (
                <Group justify="center" mt="xl">
                    <Pagination total={totalPages} value={page} onChange={setPage} color="blue" />
                </Group>
            )}
        </div>
    );
}