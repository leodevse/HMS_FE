// src/pages/housekeeping/components/MinibarModal.jsx
import { useState, useEffect } from 'react';
import {
    Modal,
    Stack,
    Group,
    Text,
    NumberInput,
    Button,
    Loader,
    Paper,
    Divider,
    Table,
    Badge,
    ActionIcon,
    Center  // THÊM IMPORT NÀY
} from '@mantine/core';
import { IconMinus, IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { housekeepingApi } from '../../../apis/housekeepingApi';

export function MinibarModal({ opened, onClose, roomId, reservationId, onSuccess, reportMinibar }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [total, setTotal] = useState(0);

    // Load minibar items khi modal mở
    useEffect(() => {
        if (opened && roomId) {
            loadMinibarItems();
        }
    }, [opened, roomId]);

    useEffect(() => {
        const newTotal = items.reduce((sum, item) =>
            sum + (item.consumed || 0) * item.price, 0
        );
        setTotal(newTotal);
    }, [items]);

    const loadMinibarItems = async () => {
        setLoading(true);
        try {
            const response = await housekeepingApi.getMinibarItems(roomId);
            setItems(response.data.data.map(item => ({
                ...item,
                consumed: 0
            })));
        } catch (error) {
            // notifications.show({
            //     title: 'Error',
            //     message: 'Failed to load minibar items',
            //     color: 'red'
            // });
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = (itemId, newQuantity) => {
        setItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, consumed: Math.min(newQuantity, item.currentQuantity) }
                    : item
            )
        );
    };

    const increment = (itemId) => {
        setItems(prev =>
            prev.map(item =>
                item.id === itemId && item.consumed < item.currentQuantity
                    ? { ...item, consumed: (item.consumed || 0) + 1 }
                    : item
            )
        );
    };

    const decrement = (itemId) => {
        setItems(prev =>
            prev.map(item =>
                item.id === itemId && item.consumed > 0
                    ? { ...item, consumed: item.consumed - 1 }
                    : item
            )
        );
    };

    const resetItem = (itemId) => {
        setItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, consumed: 0 }
                    : item
            )
        );
    };

    const handleSubmit = async () => {
        const consumed = items.filter(item => item.consumed > 0);
        if (consumed.length === 0) {
            notifications.show({
                title: 'Info',
                message: 'No items selected',
                color: 'blue'
            });
            onClose();
            return;
        }

        setSubmitting(true);
        try {
            const result = await reportMinibar({
                roomId,
                reservationId,
                items: consumed.map(item => ({
                    roomAssetId: item.id,
                    quantity: item.consumed
                }))
            });

            if (result.success) {
                notifications.show({
                    title: 'Success',
                    message: `Added $${total.toFixed(2)} to guest folio`,
                    color: 'green'
                });

                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to record minibar',
                color: 'red'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Minibar Consumption"
            size="lg"
            centered
        >
            {loading ? (
                <Center py="xl">  {/* Center đã được import */}
                    <Loader />
                </Center>
            ) : (
                <Stack>
                    <Text size="sm" c="dimmed">
                        Record items consumed by guest. These will be added to their folio.
                    </Text>

                    <Divider />

                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Item</Table.Th>
                                <Table.Th>Price</Table.Th>
                                <Table.Th>Available</Table.Th>
                                <Table.Th>Consumed</Table.Th>
                                <Table.Th>Total</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {items.map(item => (
                                <Table.Tr key={item.id}>
                                    <Table.Td>
                                        <Text fw={500}>{item.assetName}</Text>
                                        <Text size="xs" c="dimmed">{item.categoryName}</Text>
                                    </Table.Td>
                                    <Table.Td>${item.price.toFixed(2)}</Table.Td>
                                    <Table.Td>
                                        <Badge color={item.currentQuantity > 0 ? 'green' : 'red'}>
                                            {item.currentQuantity}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <ActionIcon
                                                size="sm"
                                                variant="light"
                                                onClick={() => decrement(item.id)}
                                                disabled={!item.consumed}
                                            >
                                                <IconMinus size={14} />
                                            </ActionIcon>
                                            <NumberInput
                                                value={item.consumed || 0}
                                                onChange={(val) => updateQuantity(item.id, val)}
                                                min={0}
                                                max={item.currentQuantity}
                                                w={60}
                                                size="xs"
                                                hideControls
                                            />
                                            <ActionIcon
                                                size="sm"
                                                variant="light"
                                                onClick={() => increment(item.id)}
                                                disabled={item.consumed >= item.currentQuantity}
                                            >
                                                <IconPlus size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        ${((item.consumed || 0) * item.price).toFixed(2)}
                                    </Table.Td>
                                    <Table.Td>
                                        {item.consumed > 0 && (
                                            <ActionIcon
                                                size="sm"
                                                color="red"
                                                variant="light"
                                                onClick={() => resetItem(item.id)}
                                            >
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    {total > 0 && (
                        <Paper withBorder p="md" bg="blue.0">
                            <Group justify="space-between">
                                <Text fw={600}>Total to add to folio:</Text>
                                <Text fw={700} size="xl" c="blue">
                                    ${total.toFixed(2)}
                                </Text>
                            </Group>
                        </Paper>
                    )}

                    <Group grow mt="md">
                        <Button variant="light" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={items.every(i => !i.consumed)}
                        >
                            Add to Folio
                        </Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
}