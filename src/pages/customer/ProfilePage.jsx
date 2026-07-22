import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Container,
    Group,
    Loader,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { authApi } from '../../apis/auth/authApi.js';
import { userApi } from '../../apis/userApi.js';

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        id: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        identityCard: '',
        address: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await authApi.getMyProfile();
            setProfile({
                id: data?.id || '',
                fullName: data?.fullName || '',
                email: data?.email || '',
                phoneNumber: data?.phoneNumber || '',
                identityCard: data?.identityCard || '',
                address: data?.address || '',
            });
            setError('');
        } catch (err) {
            console.error('Failed to load profile', err);
            setError('Unable to load your profile right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (field) => (event) => {
        setProfile((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        try {
            await userApi.updateProfile({
                fullName: profile.fullName,
                phoneNumber: profile.phoneNumber,
                identityCard: profile.identityCard,
                address: profile.address,
            });

            notifications.show({
                title: 'Success',
                message: 'Your profile has been updated.',
                color: 'green',
                icon: <IconCheck size={18} />,
            });
        } catch (err) {
            console.error('Failed to update profile', err);
            setError('Unable to update your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container size="md" py="xl">
                <Card withBorder radius="md" p="xl">
                    <Group justify="center">
                        <Loader />
                    </Group>
                </Card>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl">
            <Card withBorder radius="md" p="xl">
                <Stack gap="lg">
                    <div>
                        <Title order={2}>My Profile</Title>
                        <Text c="dimmed">Manage your personal information here.</Text>
                    </div>

                    {error && (
                        <Alert icon={<IconAlertCircle size={16} />} title="Notice" color="red" variant="light">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack gap="md">
                            <TextInput
                                label="Full name"
                                placeholder="Enter your full name"
                                value={profile.fullName}
                                onChange={handleChange('fullName')}
                                required
                            />
                            <TextInput
                                label="Email"
                                value={profile.email}
                                disabled
                                description="Email cannot be changed"
                            />
                            <TextInput
                                label="Phone number"
                                placeholder="Enter phone number"
                                value={profile.phoneNumber}
                                onChange={handleChange('phoneNumber')}
                            />
                            <TextInput
                                label="Identity card"
                                placeholder="Enter identity card"
                                value={profile.identityCard}
                                onChange={handleChange('identityCard')}
                            />
                            <TextInput
                                label="Address"
                                placeholder="Enter address"
                                value={profile.address}
                                onChange={handleChange('address')}
                            />

                            <Group justify="flex-end">
                                <Button type="submit" loading={saving}>
                                    Save Changes
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                </Stack>
            </Card>
        </Container>
    );
}
