// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import { Container, Paper, Box, Title, Text } from '@mantine/core';

export function AuthLayout() {
    return (
        <Box
            style={{
                minHeight: '100vh',
                width: '100%',
                backgroundImage: `url('https://mir-s3-cdn-cf.behance.net/project_modules/1400/bd622d205541319.66bcb632220e7.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Overlay tối để làm nổi bật form */}
            <Box
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                    zIndex: 1,
                }}
            />

            {/* Container cho Outlet - nổi lên trên overlay */}
            <Container
                size="sm"
                style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: 450,
                }}
            >

                    <Box mb="lg" ta="center">
                        <Title order={1} size="h2" c="white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            🏨 FPTU Hotel
                        </Title>
                    </Box>
                    <Outlet />
            </Container>
        </Box>
    );
}