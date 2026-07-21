import { useEffect, useState } from 'react';
import { Modal, TextInput, Switch, Button, Group, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';

export function UserEditModal({ opened, onClose, user, onSubmit }) {
    const [saving, setSaving] = useState(false);

    const form = useForm({
        initialValues: {
            fullName: user?.fullName || '',
            phoneNumber: user?.phoneNumber || '',
            identityCard: user?.identityCard || '',
            isActive: user?.isActive ?? true,
        },
        validate: {
            fullName: (value) => (value.trim().length === 0 ? 'Name is required' : null),
            phoneNumber: (value) => (value && value.length < 10 ? 'Phone number is too short' : null),
        },
    });

    useEffect(() => {
        if (user) {
            form.setValues({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || '',
                identityCard: user.identityCard || '',
                isActive: user.isActive ?? true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleSubmit = async (values) => {
        if (!user) return;
        setSaving(true);
        try {
            await onSubmit(values);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Edit User" size="lg" radius="md">
            {user ? (
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack spacing="sm">
                        <TextInput
                            label="Email"
                            value={user.email}
                            disabled
                        />
                        <TextInput
                            label="Name"
                            placeholder="Enter user name"
                            {...form.getInputProps('fullName')}
                        />
                        <TextInput
                            label="Phone"
                            placeholder="Enter phone number"
                            {...form.getInputProps('phoneNumber')}
                        />
                        <TextInput
                            label="Identity Card"
                            placeholder="Enter identity card"
                            {...form.getInputProps('identityCard')}
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
                <Text>No user selected</Text>
            )}
        </Modal>
    );
}
