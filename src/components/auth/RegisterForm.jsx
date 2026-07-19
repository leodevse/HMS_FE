// src/components/auth/RegisterForm.jsx
import { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
    Paper,
    Title,
    Text,
    Anchor,
    Stack,
    Group,
    Box,
    Stepper,
    Alert,
    Container,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function RegisterForm() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(0);
    const [error, setError] = useState(null);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            phoneNumber: '',
            identityCard: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
            confirmPassword: (value, values) =>
                value !== values.password ? 'Passwords do not match' : null,
            fullName: (value) => {
                if (active === 1 && !value) return 'Full name is required';
                if (value && value.length < 2) return 'Name is too short';
                return null;
            },
            phoneNumber: (value) => {
                if (active === 1 && !value) return 'Phone number is required';
                if (value && !/^\d{10,11}$/.test(value)) return 'Phone number must be 10-11 digits';
                return null;
            },
            identityCard: (value) => {
                if (value && !/^\d{9,12}$/.test(value)) return 'Identity card must be 9-12 digits';
                return null;
            },
        },
        validateInputOnChange: true,
    });

    const nextStep = () => {
        if (active === 0) {
            // Chỉ validate 3 field của step 1
            const emailError = form.validateField('email');
            const passwordError = form.validateField('password');
            const confirmError = form.validateField('confirmPassword');

            console.log('Step 1 validation:', {
                email: emailError,
                password: passwordError,
                confirm: confirmError
            });

            // Kiểm tra nếu không có lỗi
            if (!emailError.hasError && !passwordError.hasError && !confirmError.hasError) {
                setActive(1);
            } else {
                notifications.show({
                    title: 'Validation Error',
                    message: 'Please check your account information',
                    color: 'red'
                });
            }
        }
    };

    const prevStep = () => setActive(0);

    const handleSubmit = async (values) => {
        // Validate tất cả các field trước khi submit
        const errors = form.validate();
        if (errors.hasErrors) {
            notifications.show({
                title: 'Error',
                message: 'Please fill in all required fields correctly',
                color: 'red'
            });
            return;
        }

        setLoading(true);
        setError(null);

        const userData = {
            email: values.email,
            password: values.password,
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            identityCard: values.identityCard || null,
        };

        console.log('Submitting registration:', userData);

        const result = await register(userData);
        setLoading(false);

        if (result.success) {
            notifications.show({
                title: 'Success',
                message: result.message || 'Registration successful! Please login.',
                color: 'green',
            });
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } else {
            setError(result.error);
            notifications.show({
                title: 'Error',
                message: result.error || 'Registration failed',
                color: 'red',
            });
        }
    };

    return (
        <Container size="md" px="md">
            <Paper radius="md" p="xl" shadow="md">
                <Title order={2} ta="center" mb="lg">
                    Create Customer Account
                </Title>

                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Registration Failed"
                        color="red"
                        mb="md"
                        withCloseButton
                        onClose={() => setError(null)}
                    >
                        {error}
                    </Alert>
                )}

                <Stepper active={active} onStepClick={setActive} mb="xl" size="sm">
                    <Stepper.Step label="Account" description="Create account">
                        <Stack gap="md">
                            <TextInput
                                required
                                label="Email"
                                placeholder="your@email.com"
                                size="md"
                                {...form.getInputProps('email')}
                            />
                            <PasswordInput
                                required
                                label="Password"
                                placeholder="Your password"
                                size="md"
                                {...form.getInputProps('password')}
                            />
                            <PasswordInput
                                required
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                size="md"
                                {...form.getInputProps('confirmPassword')}
                            />
                            <Text size="sm" c="dimmed" fs="italic">
                                Note: You are registering as a Customer. Staff accounts are created by Admin.
                            </Text>
                        </Stack>
                    </Stepper.Step>

                    <Stepper.Step label="Personal" description="Personal information">
                        <Stack gap="md">
                            <TextInput
                                required
                                label="Full Name"
                                placeholder="Your full name"
                                size="md"
                                {...form.getInputProps('fullName')}
                            />
                            <TextInput
                                required
                                label="Phone Number"
                                placeholder="Your phone number"
                                size="md"
                                {...form.getInputProps('phoneNumber')}
                            />
                            <TextInput
                                label="Identity Card"
                                placeholder="ID/Passport number (optional)"
                                size="md"
                                {...form.getInputProps('identityCard')}
                            />
                        </Stack>
                    </Stepper.Step>

                    <Stepper.Completed>
                        <Stack align="center" py="xl">
                            <Text size="lg" fw={500}>All set!</Text>
                            <Text c="dimmed" ta="center">
                                Click register to create your customer account.
                            </Text>
                        </Stack>
                    </Stepper.Completed>
                </Stepper>

                <Group justify="space-between" mt="xl">
                    {active === 1 && (
                        <Button variant="default" onClick={prevStep} size="md">
                            Back
                        </Button>
                    )}
                    {active === 0 && (
                        <Button onClick={nextStep} size="md">
                            Next
                        </Button>
                    )}
                    {active === 1 && (
                        <Button onClick={() => form.onSubmit(handleSubmit)()} loading={loading} size="md">
                            Register
                        </Button>
                    )}
                </Group>

                <Text ta="center" mt="lg">
                    Already have an account?{' '}
                    <Anchor component="button" onClick={() => navigate('/login')}>
                        Login
                    </Anchor>
                </Text>
            </Paper>
        </Container>
    );
}