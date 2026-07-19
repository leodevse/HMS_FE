import { Modal, Select, Button, Group, TextInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { scheduleApi } from '../../../apis/admin/scheduleApi';

export function ScheduleCreateModal({ opened, onClose, onSuccess, staffs = [], shifts = [] }) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            staffId: '',
            shiftId: '',
            startDate: '',
            endDate: ''
        },
        validate: {
            staffId: (value) => (!value ? 'Vui lòng chọn nhân viên' : null),
            shiftId: (value) => (!value ? 'Vui lòng chọn ca làm việc' : null),
            startDate: (value) => (!value ? 'Vui lòng chọn ngày bắt đầu' : null),
            endDate: (value, values) => {
                if (!value) return 'Vui lòng chọn ngày kết thúc';
                // Validate endDate phải >= startDate
                if (values.startDate && new Date(value) < new Date(values.startDate)) {
                    return 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
                }
                return null;
            },
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await scheduleApi.createSchedule(values);
            notifications.show({ title: 'Thành công', message: 'Đã phân ca làm việc', color: 'green' });
            form.reset();
            onSuccess();
            onClose();
        } catch (error) {
            // Lấy message lỗi từ Backend ném ra (ví dụ: lỗi validate FutureOrPresent)
            const errorMsg = error.response?.data?.message || 'Không thể tạo lịch làm việc';
            notifications.show({ title: 'Lỗi', message: errorMsg, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Tạo / Phân lịch làm việc" size="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="sm">
                    <Select
                        withAsterisk
                        label="Nhân viên"
                        placeholder="Chọn nhân viên"
                        data={(Array.isArray(staffs) ? staffs : []).map(s => ({ value: s.id.toString(), label: `${s.fullName} - ${s.department || s.role}` }))}
                        {...form.getInputProps('staffId')}
                        searchable
                    />

                    <Select
                        withAsterisk
                        label="Ca làm việc"
                        placeholder="Chọn ca"
                        data={(Array.isArray(shifts) ? shifts : []).map(s => ({ value: s.id.toString(), label: `${s.name} (${String(s.startTime).slice(0, 5)} - ${String(s.endTime).slice(0, 5)})` }))}
                        {...form.getInputProps('shiftId')}
                    />

                    <Group grow>
                        <TextInput
                            type="date"
                            withAsterisk
                            label="Từ ngày (Start)"
                            {...form.getInputProps('startDate')}
                        />
                        <TextInput
                            type="date"
                            withAsterisk
                            label="Đến ngày (End)"
                            {...form.getInputProps('endDate')}
                        />
                    </Group>
                </Stack>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={onClose}>Hủy</Button>
                    <Button type="submit" loading={loading}>Lưu lịch</Button>
                </Group>
            </form>
        </Modal>
    );
}
