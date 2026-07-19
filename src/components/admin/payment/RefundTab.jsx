import { useState, useEffect } from 'react';
import {
    Table, Badge, Pagination, Group, Text, LoadingOverlay,
    ActionIcon, Tooltip, Modal, Button, Textarea, Stack, Grid, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck, IconX } from '@tabler/icons-react';
import { refundApi } from '../../../apis/admin/refundApi';

export function RefundTab() {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // Modals state
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const [rejectOpened, { open: openReject, close: closeReject }] = useDisclosure(false);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const params = { page: page - 1, size: 6 };
            const res = await refundApi.getPendingRefunds(params);
            setRefunds(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Tải danh sách hoàn tiền thất bại', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRefunds(); }, [page]);

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // Xử lý Approve
    const handleApprove = (id) => {
        modals.openConfirmModal({
            title: 'Xác nhận duyệt hoàn tiền',
            children: <Text size="sm">Bạn có chắc chắn muốn duyệt yêu cầu hoàn tiền này? Hành động này sẽ tạo giao dịch chuyển tiền.</Text>,
            labels: { confirm: 'Duyệt', cancel: 'Hủy' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    await refundApi.approveRefund(id);
                    notifications.show({ title: 'Thành công', message: 'Đã duyệt yêu cầu hoàn tiền', color: 'green' });
                    closeDetail();
                    fetchRefunds();
                } catch (error) {
                    notifications.show({ title: 'Lỗi', message: 'Không thể duyệt yêu cầu', color: 'red' });
                }
            },
        });
    };

    // Xử lý Submit Reject
    const submitReject = async () => {
        if (!rejectReason.trim()) {
            notifications.show({ title: 'Cảnh báo', message: 'Vui lòng nhập lý do từ chối', color: 'yellow' });
            return;
        }
        try {
            await refundApi.rejectRefund(selectedRefund.id, rejectReason);
            notifications.show({ title: 'Thành công', message: 'Đã từ chối yêu cầu hoàn tiền', color: 'green' });
            closeReject();
            closeDetail();
            setRejectReason('');
            fetchRefunds();
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Không thể từ chối yêu cầu', color: 'red' });
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '400px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} />
            <Group justify="flex-end" mb="sm">
                <Text size="sm" c="dimmed" fw={500}>Tìm thấy: {totalElements} yêu cầu chờ xử lý</Text>
            </Group>

            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Số tiền</Table.Th>
                        <Table.Th>Lý do yêu cầu</Table.Th>
                        <Table.Th>Người yêu cầu</Table.Th>
                        <Table.Th>Ngày tạo</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Thao tác</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {refunds.length > 0 ? refunds.map((req) => (
                        <Table.Tr key={req.id}>
                            <Table.Td>{req.id}</Table.Td>
                            <Table.Td fw={600} c="red">{formatCurrency(req.amount)}</Table.Td>
                            <Table.Td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {req.reason}
                            </Table.Td>
                            <Table.Td>{req.requestedByName}</Table.Td>
                            <Table.Td>{new Date(req.createdAt).toLocaleString('vi-VN')}</Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                                <Group justify="center" gap="xs">
                                    <Tooltip label="Xem chi tiết">
                                        <ActionIcon variant="light" color="blue" onClick={() => { setSelectedRefund(req); openDetail(); }}>
                                            <IconEye size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Duyệt">
                                        <ActionIcon variant="light" color="green" onClick={() => handleApprove(req.id)}>
                                            <IconCheck size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Từ chối">
                                        <ActionIcon variant="light" color="red" onClick={() => { setSelectedRefund(req); setRejectReason(''); openReject(); }}>
                                            <IconX size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    )) : (
                        <Table.Tr><Table.Td colSpan={6} ta="center" py="xl"><Text c="dimmed">Không có yêu cầu hoàn tiền nào đang chờ</Text></Table.Td></Table.Tr>
                    )}
                </Table.Tbody>
            </Table>

            {totalPages > 1 && (
                <Group justify="center" mt="xl">
                    <Pagination total={totalPages} value={page} onChange={setPage} color="blue" />
                </Group>
            )}

            {/* Modal Chi Tiết */}
            <Modal opened={detailOpened} onClose={closeDetail} title="Chi tiết yêu cầu hoàn tiền" size="lg">
                {selectedRefund && (
                    <Stack spacing="sm">
                        <Grid>
                            <Grid.Col span={4}><Text fw={500}>ID Yêu cầu:</Text></Grid.Col>
                            <Grid.Col span={8}><Text>{selectedRefund.id}</Text></Grid.Col>

                            <Grid.Col span={4}><Text fw={500}>Số tiền hoàn:</Text></Grid.Col>
                            <Grid.Col span={8}><Text fw={600} c="red">{formatCurrency(selectedRefund.amount)}</Text></Grid.Col>

                            <Grid.Col span={4}><Text fw={500}>Người yêu cầu:</Text></Grid.Col>
                            <Grid.Col span={8}><Text>{selectedRefund.requestedByName}</Text></Grid.Col>

                            <Grid.Col span={4}><Text fw={500}>Lý do:</Text></Grid.Col>
                            <Grid.Col span={8}><Text>{selectedRefund.reason}</Text></Grid.Col>

                            <Grid.Col span={4}><Text fw={500}>Ngày tạo:</Text></Grid.Col>
                            <Grid.Col span={8}><Text>{new Date(selectedRefund.createdAt).toLocaleString('vi-VN')}</Text></Grid.Col>
                        </Grid>

                        {selectedRefund.paymentTransaction && (
                            <>
                                <Divider my="sm" variant="dashed" />
                                <Text fw={600} c="blue" mb="xs">Thông tin giao dịch gốc</Text>
                                <Grid>
                                    <Grid.Col span={4}><Text fw={500}>Mã GD:</Text></Grid.Col>
                                    <Grid.Col span={8}><Text>{selectedRefund.paymentTransaction.code}</Text></Grid.Col>
                                    <Grid.Col span={4}><Text fw={500}>Phương thức:</Text></Grid.Col>
                                    <Grid.Col span={8}><Badge>{selectedRefund.paymentTransaction.paymentMethod}</Badge></Grid.Col>
                                </Grid>
                            </>
                        )}

                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" color="red" onClick={() => { setRejectReason(''); openReject(); }}>Từ chối</Button>
                            <Button color="green" onClick={() => handleApprove(selectedRefund.id)}>Phê duyệt</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Modal Từ chối (Nhập lý do) */}
            <Modal opened={rejectOpened} onClose={closeReject} title="Từ chối hoàn tiền" zIndex={2000}>
                <Textarea
                    withAsterisk
                    label="Lý do từ chối"
                    placeholder="Nhập lý do chi tiết..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.currentTarget.value)}
                    minRows={3}
                    data-autofocus
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeReject}>Hủy</Button>
                    <Button color="red" onClick={submitReject}>Xác nhận từ chối</Button>
                </Group>
            </Modal>
        </div>
    );
}