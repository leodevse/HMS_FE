import { useState, useEffect } from 'react';
import {
    Title, Button, Table, Text, LoadingOverlay, Tooltip, Badge
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

    // Render shift badge with professional styling
    const renderShiftBadge = (schedule) => {
        const shiftName = schedule.shiftName || '';
        let displayText = 'Off';
        let backgroundColor = 'white';
        let textColor = '#333';
        let borderStyle = '1.5px solid #333';

        // Map Vietnamese shift names to display text and determine styling
        const shiftNameLower = shiftName.toLowerCase();
        
        if (shiftNameLower.includes('đêm') || shiftNameLower.includes('night')) {
            displayText = 'Night';
            backgroundColor = '#999';
            textColor = 'white';
            borderStyle = 'none';
        } else if (
            shiftNameLower.includes('sáng') || 
            shiftNameLower.includes('chiều') || 
            shiftNameLower.includes('day') ||
            shiftNameLower.includes('morning') ||
            shiftNameLower.includes('afternoon')
        ) {
            displayText = 'Day';
            backgroundColor = '#000';
            textColor = 'white';
            borderStyle = 'none';
        } else if (shiftNameLower.includes('off')) {
            displayText = 'Off';
            backgroundColor = 'white';
            textColor = '#333';
            borderStyle = '1.5px solid #333';
        } else if (shiftName === '' || schedule.status === 'OFF') {
            displayText = 'Off';
            backgroundColor = 'white';
            textColor = '#333';
            borderStyle = '1.5px solid #333';
        }

        return (
            <Tooltip 
                label="Click to delete" 
                withArrow 
                position="top"
            >
                <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    style={{
                        backgroundColor: backgroundColor,
                        color: textColor,
                        border: borderStyle,
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '75px',
                        transition: 'all 0.2s',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.8';
                        e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'scale(1)';
                    }}
                >
                    {displayText}
                </button>
            </Tooltip>
        );
    };

    // Format week display (e.g., "Nov 20 - Nov 26, 2023")
    const formatWeekDisplay = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const startMonth = monthNames[startOfWeek.getMonth()];
        const endMonth = monthNames[endOfWeek.getMonth()];
        const startDay = startOfWeek.getDate();
        const endDay = endOfWeek.getDate();
        const year = endOfWeek.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${startDay} - ${endDay}, ${year}`;
        }
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title order={2} style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                    Schedule Management
                </Title>
                <Button 
                    leftSection={<IconPlus size={18} />} 
                    onClick={openCreate}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px',
                        padding: '10px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Assign Schedule
                </Button>
            </div>

            {/* Main Card Container */}
            <div 
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    padding: '24px',
                    border: '1px solid #e0e0e0'
                }}
            >
                {/* Week Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                    <button
                        onClick={handlePrevWeek}
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: 0
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5f5f5';
                            e.target.style.borderColor = '#999';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#d0d0d0';
                        }}
                    >
                        <IconChevronLeft size={20} color="#666" />
                    </button>

                    <div style={{ minWidth: '200px', textAlign: 'center' }}>
                        <Text 
                            style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#1a1a1a',
                                margin: 0
                            }}
                        >
                            {formatWeekDisplay()}
                        </Text>
                    </div>

                    <button
                        onClick={handleNextWeek}
                        style={{
                            backgroundColor: 'white',
                            border: '1px solid #d0d0d0',
                            borderRadius: '6px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: 0
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5f5f5';
                            e.target.style.borderColor = '#999';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                            e.target.style.borderColor = '#d0d0d0';
                        }}
                    >
                        <IconChevronRight size={20} color="#666" />
                    </button>
                </div>

                {/* Schedule Table */}
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <Table 
                        style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            fontSize: '14px'
                        }}
                    >
                        <Table.Thead>
                            <Table.Tr 
                                style={{
                                    backgroundColor: '#f5f5f5',
                                    borderBottom: '2px solid #e0e0e0'
                                }}
                            >
                                <Table.Th 
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontWeight: 700,
                                        color: '#333',
                                        width: '160px',
                                        minWidth: '160px',
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    Staff Member
                                </Table.Th>
                                {weekDays.map((day, index) => {
                                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    const dayName = dayNames[day.getDay()];
                                    const dayDate = day.getDate();
                                    return (
                                        <Table.Th 
                                            key={index}
                                            style={{
                                                padding: '12px 8px',
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                color: '#333',
                                                minWidth: '100px',
                                                width: '100px',
                                                border: '1px solid #e0e0e0'
                                            }}
                                        >
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{dayName}</div>
                                            <div style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>{dayDate}</div>
                                        </Table.Th>
                                    );
                                })}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {staffs.length > 0 ? (
                                staffs.map((staff, rowIndex) => (
                                    <Table.Tr 
                                        key={staff.id}
                                        style={{
                                            borderBottom: '1px solid #e0e0e0',
                                            backgroundColor: rowIndex % 2 === 0 ? 'white' : '#fafafa',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'white' : '#fafafa'}
                                    >
                                        {/* Staff Name Cell */}
                                        <Table.Td 
                                            style={{
                                                padding: '12px 16px',
                                                fontWeight: 600,
                                                color: '#1a1a1a',
                                                verticalAlign: 'middle',
                                                border: '1px solid #e0e0e0'
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                                {staff.fullName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
                                                {staff.department || 'N/A'}
                                            </div>
                                        </Table.Td>

                                        {/* Day Cells */}
                                        {weekDays.map((day, index) => {
                                            const dayStr = formatDateToYYYYMMDD(day);
                                            const staffSchedules = schedules.filter(
                                                s => s.staffId === staff.id && s.workDate === dayStr
                                            );

                                            return (
                                                <Table.Td 
                                                    key={index}
                                                    style={{
                                                        padding: '12px 8px',
                                                        textAlign: 'center',
                                                        verticalAlign: 'middle',
                                                        border: '1px solid #e0e0e0',
                                                        height: '70px'
                                                    }}
                                                >
                                                    {staffSchedules.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                            {staffSchedules.map(schedule => (
                                                                <div key={schedule.id} style={{ width: '100%' }}>
                                                                    {renderShiftBadge(schedule)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Text size="xs" c="gray.5" style={{ color: '#ccc' }}>-</Text>
                                                    )}
                                                </Table.Td>
                                            );
                                        })}
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#999', border: '1px solid #e0e0e0' }}>
                                        <Text c="dimmed">No staff data available</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#000', borderRadius: '3px' }}></div>
                        <Text size="sm" style={{ color: '#333', fontWeight: 500 }}>Day</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: '#999', borderRadius: '3px' }}></div>
                        <Text size="sm" style={{ color: '#333', fontWeight: 500 }}>Night</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: 'white', border: '1.5px solid #333', borderRadius: '3px' }}></div>
                        <Text size="sm" style={{ color: '#333', fontWeight: 500 }}>Off</Text>
                    </div>
                </div>
            </div>

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