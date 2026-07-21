import { useEffect, useState } from 'react';
import { Modal, TextInput, Switch, Button, Group, Stack, Text, Select } from '@mantine/core';
import { useForm } from '@mantine/form';

export function StaffEditModal({ opened, onClose, staff, onSubmit }) {
    const [saving, setSaving] = useState(false);

    const form = useForm({
        initialValues: {
            fullName: staff?.fullName || '',
            email: staff?.email || '',
            phoneNumber: staff?.phoneNumber || '',
            department: staff?.department || '',
            status: staff?.status || 'AVAILABLE',
            isActive: staff?.isActive ?? true,
        },
        validate: {
            fullName: (value) => (value.trim().length === 0 ? 'Name is required' : null),
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            phoneNumber: (value) => (value && value.length < 10 ? 'Phone number is too short' : null),
            department: (value) => (!value ? 'Department is required' : null),
        },
    });

    useEffect(() => {
        if (staff) {
            form.setValues({
                fullName: staff.fullName || '',
                email: staff.email || '',
                phoneNumber: staff.phoneNumber || '',
                department: staff.department || '',
                status: staff.status || 'AVAILABLE',
                isActive: staff.isActive ?? true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staff]);

    const handleSubmit = async (values) => {
        if (!staff) return;
        setSaving(true);
        try {
            await onSubmit(values);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit Staff" size="lg" radius="md">
            {staff ? (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack spacing="sm">
                        <TextInput
                            label="Email"
                            value={staff.email}
                            disabled
                        />
                        <TextInput
                            label="Name"
                            placeholder="Enter staff name"
                            {...form.getInputProps('fullName')}
                        />
                        <TextInput
                            label="Phone"
                            placeholder="Enter phone number"
                            {...form.getInputProps('phoneNumber')}
                        />
                        <Select
                            label="Department"
                            placeholder="Select department"
                            data={[
                                { value: 'HOUSEKEEPING', label: 'Housekeeping' },
                                { value: 'RECEPTION', label: 'Reception' },
                                { value: 'F&B', label: 'F&B' },
                                { value: 'SALES_MARKETING', label: 'Sales & Marketing' },
                                { value: 'HR', label: 'HR' },
                                { value: 'ENGINEERING', label: 'Engineering' },
                            ]}
                            {...form.getInputProps('department')}
                        />
                        <Select
                            label="Status"
                            placeholder="Select status"
                            data={[
                                { value: 'AVAILABLE', label: 'Available' },
                                { value: 'BUSY', label: 'Busy' },
                                { value: 'ON_LEAVE', label: 'On leave' },
                            ]}
                            {...form.getInputProps('status')}
                        />
                        <Switch
                            label="Active"
                            {...form.getInputProps('isActive', { type: 'checkbox' })}
                        />

                        <Group position="right" mt="md">
                            <Button variant="default" onClick={onClose}>Cancel</Button>
                            <Button type="submit" color="blue" loading={saving}>Save changes</Button>
                        </Group>
                    </Stack>
                </form>
            ) : (
                <Text>No staff selected</Text>
            )}
        </Modal>
    );
}
