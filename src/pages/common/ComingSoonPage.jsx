import {Box, Button, Container, Group, Loader, rem, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import {IconArrowLeft, IconHammer, IconTool} from '@tabler/icons-react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from "../../hooks/useAuth.jsx";

export const ComingSoonPage = () => {
    const navigate = useNavigate();
    const {user, getDashboardPath} = useAuth();

    return (
            <Container size="md" py={80}>
                <Stack align="center" gap="xl">
                    {/* Icon chính với hiệu ứng xoay nhẹ nhàng */}
                    <Box style={{position: 'relative'}}>
                        <ThemeIcon
                                size={120}
                                radius={100}
                                variant="light"
                                color="orange"
                        >
                            <IconHammer style={{width: rem(60), height: rem(60)}}/>
                        </ThemeIcon>
                        {/* Loader nhỏ chạy quanh icon tạo cảm giác đang làm việc */}
                        <Loader
                                color="orange"
                                size="xl"
                                type="dots"
                                style={{
                                    position: 'absolute',
                                    bottom: -10,
                                    right: -10
                                }}
                        />
                    </Box>

                    <Stack align="center" gap="xs">
                        <Title
                                order={1}
                                style={{
                                    fontSize: rem(34),
                                    textAlign: 'center',
                                    fontWeight: 900
                                }}
                        >
                            Trang này đang được bảo trì!
                        </Title>

                        <Text
                                c="dimmed"
                                size="lg"
                                maw={500}
                                ta="center"
                        >
                            Rất xin lỗi phen, tính năng này hiện tại mình chưa kịp code xong.
                            Đội ngũ (là mình) đang cày cuốc ngày đêm để ra mắt sớm nhất.
                        </Text>
                    </Stack>

                    <Group justify="center" mt="md">
                        <Button
                                variant="light"
                                color="gray"
                                leftSection={<IconArrowLeft size={18}/>}
                                onClick={() => navigate(-1)}
                                radius="md"
                                size="md"
                        >
                            Quay lại trang trước
                        </Button>

                        <Button
                                color="teal"
                                leftSection={<IconTool size={18}/>}
                                onClick={() => navigate(getDashboardPath(user))}
                                radius="md"
                                size="md"
                        >
                            Về bảng điều khiển
                        </Button>
                    </Group>

                    {/* Phần trang trí thêm cho đỡ trống */}
                    <Box
                            mt={50}
                            p="md"
                            style={{
                                border: `${rem(1)} dashed var(--mantine-color-gray-3)`,
                                borderRadius: 'var(--mantine-radius-md)'
                            }}
                    >
                        <Text size="xs" c="dimmed" fs="italic">
                            Tiến độ hoàn thành: 75% - Đang tích hợp nốt mấy cái animation "xịn" phen bảo...
                        </Text>
                    </Box>
                </Stack>
            </Container>
    );
};