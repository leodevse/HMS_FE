import { Modal, Select, Button, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { housekeepingApi } from '../../../apis/admin/housekeepingApi';

export function AssignTaskModal({ opened, onClose, onSuccess, room, staffs }) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            roomId: '',
            staffId: '',
            taskType: ''
        },
        validate: {
            staffId: (value) => (!value ? 'Vui lòng chọn nhân viên' : null),
            taskType: (value) => (!value ? 'Vui lòng chọn loại công việc' : null),
        },
    });

    // Cập nhật roomId khi form mở
    if (room && form.values.roomId !== room.id.toString()) {
        form.setFieldValue('roomId', room.id.toString());
    }

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const selectedStaff = staffs.find((staff) => String(staff.id) === String(values.staffId));
            await housekeepingApi.assignTask({
                roomId: Number(values.roomId),
                staffId: Number(values.staffId),
                assigneeName: selectedStaff?.fullName || selectedStaff?.email || `Staff #${values.staffId}`,
                taskType: values.taskType
            });
            notifications.show({ title: 'Thành công', message: `Đã giao việc phòng ${room.roomNumber}`, color: 'green' });
            form.reset();
            onSuccess();
            onClose();
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Không thể giao công việc', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={`Giao nhiệm vụ - Phòng ${room?.roomNumber || ''}`} size="sm">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="sm">
                    <Text size="sm" c="dimmed" mb="sm">
                        Hãy chọn nhân viên Housekeeping đang trong ca để giao nhiệm vụ cho phòng này.
                    </Text>

                    <Select
                        withAsterisk
                        label="Nhân viên (Housekeeping)"
                        placeholder="Chọn nhân viên khả dụng"
                        data={(Array.isArray(staffs) ? staffs : []).map(s => ({ value: s.id.toString(), label: s.fullName || s.email }))}
                        {...form.getInputProps('staffId')}
                        searchable
                    />

                    <Select
                        withAsterisk
                        label="Loại công việc"
                        placeholder="Chọn nhiệm vụ"
                        data={[
                            { value: 'CLEANING', label: 'Dọn dẹp (Cleaning)' },
                            { value: 'INSPECTION', label: 'Kiểm tra (Inspection)' },
                            { value: 'MAINTENANCE_SUPPORT', label: 'Hỗ trợ bảo trì (Maintenance)' }
                        ]}
                        {...form.getInputProps('taskType')}
                    />
                </Stack>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={onClose}>Hủy</Button>
                    <Button type="submit" loading={loading}>Giao việc</Button>
                </Group>
            </form>
        </Modal>
    );
}
