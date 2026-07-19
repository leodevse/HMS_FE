import { Modal, TextInput, Select, Button, Group, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { staffApi } from '../../../apis/admin/staffApi';
import { notifications } from '@mantine/notifications';

export function StaffCreateModal({ opened, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            fullName: '',
            phoneNumber: '',
            department: '',
            status: 'AVAILABLE',
            isActive: true,
        },
        validate: {
            password: (value) => (value.length < 6 ? 'Password must contain at least 6 characters' : null),
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email không hợp lệ'),
            fullName: (value) => (value.length < 2 ? 'Tên phải có ít nhất 2 ký tự' : null),
            phoneNumber: (value) => (value.length < 10 ? 'Số điện thoại không hợp lệ' : null),
            department: (value) => (!value ? 'Vui lòng chọn bộ phận' : null),
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await staffApi.createStaff(values);
            notifications.show({ title: 'Thành công', message: 'Đã tạo tài khoản nhân viên', color: 'green' });
            form.reset();
            onSuccess(); // Refresh list
            onClose();
        } catch (error) {
            notifications.show({ title: 'Lỗi', message: 'Không thể tạo nhân viên', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Tạo tài khoản nhân viên" size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput withAsterisk label="Họ và tên" placeholder="Nguyễn Văn A" {...form.getInputProps('fullName')} mb="sm" />
                <TextInput withAsterisk label="Email" placeholder="example@gmail.com" {...form.getInputProps('email')} mb="sm" />
                <TextInput withAsterisk type="password" label="Mật khẩu" placeholder="Tối thiểu 6 ký tự" {...form.getInputProps('password')} mb="sm" />
                <TextInput withAsterisk label="Số điện thoại" placeholder="0987654321" {...form.getInputProps('phoneNumber')} mb="sm" />

                <Select
                    withAsterisk
                    label="Bộ phận"
                    placeholder="Chọn bộ phận"
                    data={[
                        { value: 'HOUSEKEEPING', label: 'Buồng phòng (Housekeeping)' },
                        { value: 'RECEPTION', label: 'Lễ tân (Receptionist)' },
                        { value: 'MANAGER', label: 'Quản lý (Manager)' }
                    ]}
                    {...form.getInputProps('department')}
                    mb="sm"
                />

                <Switch
                    label="Trạng thái hoạt động (Active)"
                    {...form.getInputProps('isActive', { type: 'checkbox' })}
                    mb="xl"
                    mt="sm"
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Hủy</Button>
                    <Button type="submit" loading={loading}>Tạo tài khoản</Button>
                </Group>
            </form>
        </Modal>
    );
}
