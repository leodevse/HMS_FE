import { useState, useEffect } from 'react';
import {
    Title, Paper, Group, Button, Table, Text,
    ActionIcon, Badge, LoadingOverlay, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

import { staffApi } from '../../apis/admin/staffApi';
import { shiftApi } from '../../apis/admin/shiftApi';
import { scheduleApi } from '../../apis/admin/scheduleApi';
import { ScheduleCreateModal } from '../../components/admin/schedule/ScheduleCreateModal';

export default function ScheduleManagementPage() {
    // ---- STATES ----
    const [currentDate, setCurrentDate] = useState(new Date()); // Lưu ngày hiện tại để tính tuần
    const [staffs, setStaffs] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [schedules, setSchedules] = useState([]); // Chứa lịch của cả tuần
    const [loading, setLoading] = useState(false);

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

    // ---- LOGIC TÍNH TOÁN NGÀY TRONG TUẦN ----
    // Tìm ngày thứ 2 của tuần chứa currentDate
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getStartOfWeek(currentDate);

    // Tạo mảng 7 ngày từ Thứ 2 -> Chủ Nhật
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    const endOfWeek = weekDays[6];

    // Format ngày chuẩn để gọi API (YYYY-MM-DD)
    const formatDateToYYYYMMDD = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // ---- FETCH DỮ LIỆU ----
    const fetchMasterData = async () => {
        try {
            const [staffData, shiftData] = await Promise.all([
                staffApi.getAllStaff(),
                shiftApi.getAllShifts()
            ]);
            setStaffs(staffData || []);
            setShifts(shiftData || []);
        } catch (error) {
            console.error("Lỗi tải data master:", error);
        }
    };

    const fetchWeeklySchedules = async () => {
        setLoading(true);
        try {
            const startDateStr = formatDateToYYYYMMDD(startOfWeek);
            const endDateStr = formatDateToYYYYMMDD(endOfWeek);

            const res = await scheduleApi.getSchedules(startDateStr, endDateStr);
            setSchedules(res || []);
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Không thể tải lịch làm việc tuần này', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // Chạy khi trang load lần đầu
    useEffect(() => {
        fetchMasterData();
    }, []);

    // Chạy mỗi khi đổi tuần
    useEffect(() => {
        fetchWeeklySchedules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    // ---- HANDLERS ----
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleDeleteSchedule = (scheduleId) => {
        modals.openConfirmModal({
            title: 'Xóa lịch làm việc',
            children: <Text size="sm">Bạn có chắc chắn muốn xóa ca làm việc này không?</Text>,
            labels: { confirm: 'Xóa', cancel: 'Hủy' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await scheduleApi.deleteSchedule(scheduleId);
                    notifications.show({ title: 'Thành công', message: 'Đã xóa lịch làm việc', color: 'green' });
                    fetchWeeklySchedules();
                } catch (error) {
                    notifications.show({ title: 'Lỗi', message: 'Xóa thất bại', color: 'red' });
                }
            },
        });
    };

    // Helper render Badge theo Status
    const renderStatusBadge = (schedule) => {
        let color = 'blue';
        if (schedule.status === 'ON_LEAVE') color = 'orange';
        if (schedule.status === 'COMPLETED') color = 'green';

        return (
            <Tooltip label="Click để xóa" withArrow position="top">
                <Badge
                    color={color}
                    variant="light"
                    style={{ cursor: 'pointer', display: 'block', margin: '4px 0' }}
                    onClick={() => handleDeleteSchedule(schedule.id)}
                >
                    {/* Giả định DTO trả về shiftName, nếu không có bạn nối tên ca ở backend nhé */}
                    {schedule.shiftName || `Ca ID: ${schedule.shiftId}`} <br/>
                    <span style={{fontSize: '10px'}}>({schedule.status})</span>
                </Badge>
            </Tooltip>
        );
    };

    return (
        <div style={{ position: 'relative', minHeight: '500px' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="lg">
                <Title order={2}>Lịch làm việc</Title>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Tạo lịch làm việc
                </Button>
            </Group>

            <Paper shadow="sm" p="md" mb="xl" radius="md" withBorder>
                {/* Thanh điều hướng tuần */}
                <Group justify="center" mb="xl">
                    <ActionIcon variant="light" color="blue" onClick={handlePrevWeek} size="lg">
                        <IconChevronLeft />
                    </ActionIcon>

                    <Text fw={600} size="lg" w={250} ta="center">
                        Tuần: {formatDateToYYYYMMDD(startOfWeek)} <br/>đến {formatDateToYYYYMMDD(endOfWeek)}
                    </Text>

                    <ActionIcon variant="light" color="blue" onClick={handleNextWeek} size="lg">
                        <IconChevronRight />
                    </ActionIcon>
                </Group>

                {/* BẢNG LỊCH (MATRIX) */}
                <div style={{ overflowX: 'auto' }}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ minWidth: '180px' }}>Nhân viên</Table.Th>
                                {weekDays.map((day, index) => {
                                    const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                                    return (
                                        <Table.Th key={index} style={{ textAlign: 'center', minWidth: '120px' }}>
                                            {dayNames[day.getDay()]} <br/>
                                            <Text size="xs" c="dimmed">{formatDateToYYYYMMDD(day)}</Text>
                                        </Table.Th>
                                    );
                                })}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {staffs.length > 0 ? (
                                staffs.map((staff) => (
                                    <Table.Tr key={staff.id}>
                                        {/* Cột Tên NV */}
                                        <Table.Td fw={500}>
                                            {staff.fullName}
                                            <Text size="xs" c="dimmed">{staff.department}</Text>
                                        </Table.Td>

                                        {/* 7 Cột Ngày trong tuần */}
                                        {weekDays.map((day, index) => {
                                            const dayStr = formatDateToYYYYMMDD(day);
                                            // Lọc ra ca làm việc của nhân viên này trong ngày hôm đó
                                            // Chú ý: Backend cần trả về workDate chuẩn dạng YYYY-MM-DD
                                            const staffSchedules = schedules.filter(
                                                s => s.staffId === staff.id && s.workDate === dayStr
                                            );

                                            return (
                                                <Table.Td key={index} style={{ textAlign: 'center', verticalAlign: 'top' }}>
                                                    {staffSchedules.length > 0 ? (
                                                        staffSchedules.map(schedule => (
                                                            <div key={schedule.id}>
                                                                {renderStatusBadge(schedule)}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <Text size="xs" c="gray.4">-</Text>
                                                    )}
                                                </Table.Td>
                                            );
                                        })}
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Text c="dimmed">Chưa có dữ liệu nhân viên</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </div>
            </Paper>

            <ScheduleCreateModal
                opened={createOpened}
                onClose={closeCreate}
                onSuccess={fetchWeeklySchedules}
                staffs={staffs}
                shifts={shifts}
            />
        </div>
    );
}