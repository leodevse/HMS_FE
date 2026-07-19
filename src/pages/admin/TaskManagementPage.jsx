import { useState, useEffect } from 'react';
import {
    Title, Paper, Tabs, SimpleGrid, Card, Text, Badge, Group, Table, ActionIcon, LoadingOverlay, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconCheck, IconSettings } from '@tabler/icons-react';

import { housekeepingApi } from '../../apis/admin/housekeepingApi';
import { AssignTaskModal } from '../../components/admin/housekeeping/AssignTaskModal';

export default function TaskManagementPage() {
    const [loading, setLoading] = useState(false);
    const [floors, setFloors] = useState([]);
    const [activeFloor, setActiveFloor] = useState(null);
    const [roomMatrix, setRoomMatrix] = useState([]);

    const [tasks, setTasks] = useState([]);
    const [availableStaffs, setAvailableStaffs] = useState([]);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    // 1. Fetch Master Data (Tầng & Nhân viên khả dụng)
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [floorsData, staffsData, tasksData] = await Promise.all([
                housekeepingApi.getFloors(),
                housekeepingApi.getAvailableStaff(),
                housekeepingApi.getAllTasks()
            ]);

            setFloors(floorsData || []);
            setAvailableStaffs(staffsData || []);
            setTasks(tasksData || []);

            // Default active floor là tầng đầu tiên nếu có
            if (floorsData && floorsData.length > 0) {
                setActiveFloor(floorsData[0]);
            }
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Tải dữ liệu thất bại', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch Ma trận phòng khi đổi tầng
    const fetchRoomMatrix = async (floor) => {
        if (!floor) return;
        try {
            const matrix = await housekeepingApi.getRoomMatrix(floor);
            setRoomMatrix(matrix || []);
        } catch (error) {
            console.error("Lỗi lấy ma trận phòng:", error);
        }
    };

    // 3. Fetch lại danh sách Task (Sau khi giao việc / Xóa việc)
    const refreshTasks = async () => {
        try {
            const tasksData = await housekeepingApi.getAllTasks();
            setTasks(tasksData || []);
        } catch (error) {
            console.error(error);
        }
    };

    const refreshTasksAndRooms = async () => {
        await Promise.all([refreshTasks(), fetchRoomMatrix(activeFloor)]);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchRoomMatrix(activeFloor);
    }, [activeFloor]);

    // Xử lý mở Modal Giao việc
    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        openModal();
    };

    // Xóa Task
    const handleDeleteTask = (taskId) => {
        modals.openConfirmModal({
            title: 'Hủy công việc',
            children: <Text size="sm">Bạn có chắc chắn muốn hủy nhiệm vụ này không?</Text>,
            labels: { confirm: 'Hủy việc', cancel: 'Đóng' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await housekeepingApi.deleteTask(taskId);
                    notifications.show({ title: 'Thành công', message: 'Đã hủy công việc', color: 'green' });
                    refreshTasksAndRooms();
                } catch (error) {
                    notifications.show({ title: 'Lỗi', message: 'Không thể hủy việc', color: 'red' });
                }
            },
        });
    };

    // Render Badge Status của Phòng
    const renderRoomStatus = (status) => {
        const colors = { AVAILABLE: 'green', OCCUPIED: 'blue', DIRTY: 'red', MAINTENANCE: 'orange' };
        return <Badge color={colors[status] || 'gray'} size="sm" variant="light">{status}</Badge>;
    };

    // Render Badge Status của Task
    const renderTaskStatus = (status) => {
        const colors = { PENDING: 'gray', IN_PROGRESS: 'blue', COMPLETED: 'green' };
        return <Badge color={colors[status] || 'gray'} variant="filled">{status}</Badge>;
    };

    return (
        <div style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} zIndex={1000} />

            <Title order={2} mb="lg">Task Management & Room Matrix</Title>

            {/* SƠ ĐỒ PHÒNG */}
            <Paper shadow="sm" p="md" mb="xl" withBorder>
                <Title order={4} mb="md">Sơ đồ phòng (Chọn phòng để giao việc)</Title>

                {floors.length > 0 && (
                    <Tabs value={activeFloor} onChange={setActiveFloor} mb="lg">
                        <Tabs.List>
                            {floors.map(f => (
                                <Tabs.Tab key={f} value={f}>Tầng {f}</Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs>
                )}

                <SimpleGrid cols={{ base: 2, sm: 4, md: 6, lg: 8 }} spacing="sm">
                    {roomMatrix.map((room) => (
                        <Card
                            key={room.id}
                            shadow="xs"
                            padding="sm"
                            radius="md"
                            withBorder
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => handleRoomClick(room)}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Group justify="center" mb="xs">
                                <Text fw={700} size="lg">{room.roomNumber}</Text>
                            </Group>
                            <Group justify="center">
                                {renderRoomStatus(room.status)}
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
                {roomMatrix.length === 0 && !loading && (
                    <Text c="dimmed" ta="center" py="xl">Không có phòng nào ở tầng này.</Text>
                )}
            </Paper>

            {/* DANH SÁCH NHIỆM VỤ */}
            <Paper shadow="sm" p="md" withBorder>
                <Title order={4} mb="md">Danh sách nhiệm vụ Housekeeping</Title>
                <div style={{ overflowX: 'auto' }}>
                    <Table striped highlightOnHover withTableBorder>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Phòng</Table.Th>
                                <Table.Th>Nhân viên thực hiện</Table.Th>
                                <Table.Th>Loại việc</Table.Th>
                                <Table.Th>Trạng thái</Table.Th>
                                <Table.Th>Hành động</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {tasks.length > 0 ? tasks.map((task) => (
                                <Table.Tr key={task.id}>
                                    <Table.Td>{task.id}</Table.Td>
                                    <Table.Td fw={600}>{task.roomNumber}</Table.Td>
                                    <Table.Td>{task.assigneeName}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="dot" color="grape">{task.taskType}</Badge>
                                    </Table.Td>
                                    <Table.Td>{renderTaskStatus(task.status)}</Table.Td>
                                    <Table.Td>
                                        <Tooltip label="Hủy việc">
                                            <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteTask(task.id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Table.Td>
                                </Table.Tr>
                            )) : (
                                <Table.Tr>
                                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                                        <Text c="dimmed">Chưa có nhiệm vụ nào được giao.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </div>
            </Paper>

            {/* MODAL GIAO VIỆC */}
            <AssignTaskModal
                opened={modalOpened}
                onClose={closeModal}
                room={selectedRoom}
                staffs={availableStaffs}
                onSuccess={refreshTasksAndRooms}
            />
        </div>
    );
}
