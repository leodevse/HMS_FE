import { Modal, Text, Group, Badge, Stack, Grid } from '@mantine/core';

export function StaffDetailModal({ opened, onClose, staff }) {
    if (!staff) return null;

    return (
        <Modal opened={opened} onClose={onClose} title="Chi tiết nhân viên" size="md">
            <Stack spacing="sm">
                <Grid>
                    <Grid.Col span={4}><Text fw={500}>ID:</Text></Grid.Col>
                    <Grid.Col span={8}><Text>{staff.id}</Text></Grid.Col>

                    <Grid.Col span={4}><Text fw={500}>Họ và tên:</Text></Grid.Col>
                    <Grid.Col span={8}><Text>{staff.fullName}</Text></Grid.Col>

                    <Grid.Col span={4}><Text fw={500}>Email:</Text></Grid.Col>
                    <Grid.Col span={8}><Text>{staff.email}</Text></Grid.Col>

                    <Grid.Col span={4}><Text fw={500}>Số ĐT:</Text></Grid.Col>
                    <Grid.Col span={8}><Text>{staff.phoneNumber}</Text></Grid.Col>

                    <Grid.Col span={4}><Text fw={500}>Bộ phận:</Text></Grid.Col>
                    <Grid.Col span={8}>
                        <Badge color="blue">{staff.department}</Badge>
                    </Grid.Col>

                    <Grid.Col span={4}><Text fw={500}>Trạng thái:</Text></Grid.Col>
                    <Grid.Col span={8}>
                        <Badge color={staff.isActive ? 'green' : 'red'}>
                            {staff.isActive ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                        </Badge>
                    </Grid.Col>
                </Grid>
                {/* Khu vực dự phòng để sau này gọi API show thêm lịch sử ca làm việc, v.v. */}
            </Stack>
        </Modal>
    );
}