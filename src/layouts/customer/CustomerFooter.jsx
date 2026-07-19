import { Container, Grid, Text, Stack} from '@mantine/core';

 export function CustomerFooter() {
    return (
        <footer style={{
            backgroundColor: 'var(--mantine-color-blue-9)',
            color: 'var(--mantine-color-blue-0)',
            padding: '60px 0 30px'
        }}>
            <Container size="xl">
                <Grid>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Stack gap="md">
                            <Text size="xl" fw={700} style={{ fontSize: '24px', letterSpacing: '1px' }}>FPTU HOTEL</Text>
                            <Text size="sm" c="blue.1" style={{ maxWidth: '250px' }}>
                                Luxury, comfort, and a world-class experience at FPTU Hotel.
                            </Text>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Stack gap="md">
                            <Text fw={600} style={{ fontSize: '16px' }}>About Us</Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Brand Story
                            </Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Careers
                            </Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Contact
                            </Text>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Stack gap="md">
                            <Text fw={600} style={{ fontSize: '16px' }}>Support</Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Booking Policy
                            </Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Help Center
                            </Text>
                            <Text size="md" color="blue.1" style={{ cursor: 'pointer', fontSize: '14px' }}>
                                Privacy Policy
                            </Text>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 3 }}>
                        <Stack gap="md">
                            <Text fw={600} style={{ fontSize: '16px' }}>Contact Us</Text>
                            <Text size="md" color="blue.1" style={{ fontSize: '14px' }}>
                                123 Sea Street, Nha Trang
                            </Text>
                            <Text size="md" color="blue.1" style={{ fontSize: '14px' }}>
                                contact@royalhotel.vn
                            </Text>
                            <Text size="md" color="blue.1" style={{ fontSize: '14px' }}>
                                +84 123 4567
                            </Text>
                        </Stack>
                    </Grid.Col>
                </Grid>

                <Text size="sm" c="blue.2" ta="center" mt={50}>
                    © 2024 FPTU Hotel. All rights reserved.
                </Text>
            </Container>
        </footer>
    );
}