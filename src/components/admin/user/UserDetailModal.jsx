import { Modal, Text, Grid, Badge, Stack, Table, Title, Divider } from '@mantine/core';

export function UserDetailModal({ opened, onClose, user }) {
    if (!user) return null;

    // Format timestamp to display date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString('en-US');
    };

    // Choose badge color based on reservation status
    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'green';
            case 'CHECKED_IN': return 'blue';
            case 'CHECKED_OUT': return 'gray';
            case 'CANCELLED': return 'red';
            case 'PENDING': return 'yellow';
            default: return 'gray';
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="User Details" size="xl" radius="md">
            <Stack spacing="sm">
                <Title order={5} c="blue">Personal Information</Title>
                <Grid>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>ID:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.id}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Name:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.fullName || 'Not updated'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Email:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.email}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Phone:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.phoneNumber || 'Not updated'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Identity Card:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.identityCard || 'Not updated'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Provider:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}><Text>{user.provider || 'LOCAL'}</Text></Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Role:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                        <Badge color="violet" variant="light">{user.role}</Badge>
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, md: 3 }}><Text fw={500}>Status:</Text></Grid.Col>
                    <Grid.Col span={{ base: 6, md: 3 }}>
                        <Badge color={user.isActive ? 'green' : 'red'}>
                            {user.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                    </Grid.Col>
                </Grid>

                <Divider my="md" />

                <Title order={5} c="blue">Reservation History ({user.reservations?.length || 0})</Title>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Booking Code</Table.Th>
                            <Table.Th>Check-in</Table.Th>
                            <Table.Th>Check-out</Table.Th>
                            <Table.Th>Guests</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {user.reservations && user.reservations.length > 0 ? (
                            user.reservations.map((res) => (
                                <Table.Tr key={res.bookingId}>
                                    <Table.Td fw={600}>{res.bookingCode}</Table.Td>
                                    <Table.Td>{formatDate(res.checkInDate)}</Table.Td>
                                    <Table.Td>{formatDate(res.checkOutDate)}</Table.Td>
                                    <Table.Td>{res.numberOfMembers}</Table.Td>
                                    <Table.Td>
                                        <Badge color={getStatusColor(res.status)} variant="dot">
                                            {res.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                                    <Text c="dimmed">This customer has no reservations yet.</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Stack>
        </Modal>
    );
}