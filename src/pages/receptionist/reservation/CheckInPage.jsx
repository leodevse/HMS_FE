import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import {IconArrowLeft, IconBuildingStore, IconCalendar, IconCheck, IconExternalLink, IconUser} from "@tabler/icons-react";
import {reservationApi} from "../../../apis/receptionist/reservationApi";
import {roomApi} from "../../../apis/receptionist/roomApi";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi";
import {formatUtils} from "../../../utils/formatUtils";
import {notifications} from "@mantine/notifications";

export const CheckInPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [availableRoomsByAllocation, setAvailableRoomsByAllocation] = useState({});
    const [assignments, setAssignments] = useState({});
    const [roomClasses, setRoomClasses] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [occupants, setOccupants] = useState({});

    useEffect(() => {
        if (id) {
            fetchInitialData();
        }
    }, [id]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const resDetail = await reservationApi.getReservationById(id);
            setReservation(resDetail);

            const classes = await roomClassApi.getAll();
            setRoomClasses(classes);

            const availableRoomsMap = {};
            const initialAssignments = {};

            const fetchPromises = (resDetail.allocations || []).map(async (allocation) => {
                const rooms = await roomApi.getAvailableRoomsForAssignment(
                    allocation.roomClassId,
                    String(resDetail.checkInDate).slice(0, 10),
                    String(resDetail.checkOutDate).slice(0, 10)
                );

                const roomOptions = (rooms || []).map(r => ({
                    value: r.id.toString(),
                    label: r.roomNumber
                }));

                // Nếu đã được gán phòng từ trước, đảm bảo phòng đó có trong danh sách lựa chọn
                if (allocation.roomId && !roomOptions.find(opt => opt.value === allocation.roomId.toString())) {
                    roomOptions.push({
                        value: allocation.roomId.toString(),
                        label: allocation.roomNumber || `Phòng ${allocation.roomId}` // Fallback nếu thiếu roomNumber
                    });
                }

                availableRoomsMap[allocation.id] = roomOptions;
                initialAssignments[allocation.id] = allocation.roomId ? allocation.roomId.toString() : null;
            });

            await Promise.all(fetchPromises);
            setAvailableRoomsByAllocation(availableRoomsMap);
            setAssignments(initialAssignments);
            setOccupants(Object.fromEntries((resDetail.allocations || []).map((allocation) => [
                allocation.id,
                Array.from({length: Math.max(Number(allocation.numberOfPeople) || 1, 1)}, () => ({
                    guestName: "",
                    phoneNumber: "",
                    identityDocument: "",
                    residence: "",
                })),
            ])));
        } catch (error) {
            console.error("Failed to load check-in data", error);
            notifications.show({
                title: "Lỗi",
                message: "Không thể tải thông tin đặt phòng hoặc danh sách phòng trống",
                color: "red"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        const missingAssignments = (reservation.allocations || []).some(a => !assignments[a.id]);
        if (missingAssignments) {
            notifications.show({
                title: "Lỗi",
                message: "Vui lòng chọn phòng cụ thể cho tất cả các phân bổ",
                color: "red"
            });
            return;
        }

        const invalidOccupants = (reservation.allocations || []).some((allocation) =>
            (occupants[allocation.id] || []).length !== Math.max(Number(allocation.numberOfPeople) || 1, 1)
            || (occupants[allocation.id] || []).some((guest) =>
                !guest.guestName.trim() || !guest.phoneNumber.trim()
                || !guest.identityDocument.trim() || !guest.residence.trim()
            )
        );
        if (invalidOccupants) {
            notifications.show({
                title: "Thiếu thông tin khách lưu trú",
                message: "Vui lòng nhập đầy đủ họ tên, số điện thoại, CCCD/hộ chiếu và nơi cư trú của tất cả khách.",
                color: "red"
            });
            return;
        }

        setSubmitting(true);
        try {
            const checkInRequest = {
                autoAssign: false,
                roomAssignments: Object.entries(assignments).map(([allocId, roomId]) => ({
                    reservationRoomId: parseInt(allocId),
                    roomId: parseInt(roomId)
                }))
            };

            for (const allocation of reservation.allocations || []) {
                for (const guest of occupants[allocation.id] || []) {
                    await reservationApi.registerRoomOccupant({
                        reservationRoomId: allocation.id,
                        guestName: guest.guestName.trim(),
                        phoneNumber: guest.phoneNumber.trim(),
                        identityDocument: guest.identityDocument.trim(),
                        residence: guest.residence.trim(),
                    });
                }
            }
            await reservationApi.checkInReservation(id, checkInRequest);
            notifications.show({
                message: "Check-in thành công!",
                color: "green",
                icon: <IconCheck size={16} />
            });
            navigate("/receptionist/reservations");
        } catch (error) {
            console.error("Check-in failed", error);
            notifications.show({
                title: "Lỗi Check-in",
                message: error.response?.data?.message || "Hệ thống gặp lỗi khi thực hiện check-in",
                color: "red"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getRoomClassName = (classId) => {
        return roomClasses.find(rc => rc.id === classId)?.name || `Hạng phòng ${classId}`;
    };

    const updateOccupant = (allocationId, guestIndex, field, value) => {
        setOccupants((current) => ({
            ...current,
            [allocationId]: (current[allocationId] || []).map((guest, index) =>
                index === guestIndex ? {...guest, [field]: value} : guest
            ),
        }));
    };

    if (loading) {
        return (
            <Container py="xl" ta="center">
                <Loader size="lg" variant="dots" />
                <Text mt="md" c="dimmed">Đang tải thông tin check-in...</Text>
            </Container>
        );
    }

    if (!reservation) {
        return (
            <Container py={80} ta="center">
                <Paper p="xl" withBorder shadow="sm" radius="md">
                    <Text fw={600} size="xl" color="red">Không tìm thấy thông tin đơn đặt phòng</Text>
                    <Button variant="light" mt="xl" size="lg" onClick={() => navigate(-1)}>
                        Quay lại danh sách
                    </Button>
                </Paper>
            </Container>
        );
    }

    const SectionTitle = ({children}) => (
        <Group gap="xs" mb="md" mt={20}>
            <Box style={{width: 4, height: 24, backgroundColor: '#f26522', borderRadius: 4}} />
            <Text fw={700} size="md" tt="uppercase" c="#004a8b">
                {children}
            </Text>
        </Group>
    );

    return (
        <Container size="md" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="xl">
                <Stack gap={0}>
                    <Title order={1} fw={800} c="blue.9" style={{fontSize: 28}}>Check-in</Title>
                    <Text size="sm" c="dimmed">Nhận phòng khách hàng</Text>
                </Stack>
                <Badge size="xl" variant="dot" color="blue" py="md">
                    {reservation.bookingCode}
                </Badge>
            </Group>

            <Stack gap="xl">
                {/* Information Card */}
                <Card shadow="sm" radius="lg" p="xl" withBorder style={{borderTop: '4px solid #f26522'}}>
                    <SectionTitle>Thông tin đặt phòng</SectionTitle>
                    
                    <Grid gutter="xl">
                        {/* Row 1 */}
                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Mã đặt phòng</Text>
                            <Text fw={800} size="lg" c="blue.9">{reservation.bookingCode}</Text>
                        </Grid.Col>
                        
                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Khách hàng</Text>
                            <Text fw={700} size="lg">{reservation.customer.fullName}</Text>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>CCCD / Hộ chiếu</Text>
                            <Text fw={700} size="lg">{reservation.customer.identityCard || "—"}</Text>
                        </Grid.Col>

                        {/* Row 2 */}
                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ngày nhận phòng</Text>
                            <Text fw={600}>{formatUtils.formatDate(reservation.checkInDate, true)}</Text>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Thời gian hiện tại</Text>
                            <Group gap={5}>
                                <Text fw={700} c="green.7">
                                    {formatUtils.formatDate(currentTime, true)}
                                </Text>
                                <Badge color="green" size="xs" variant="light">✓ ĐÚNG GIỜ</Badge>
                            </Group>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, sm: 4}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ngày trả phòng</Text>
                            <Text fw={600}>{formatUtils.formatDate(reservation.checkOutDate, true)}</Text>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* Allocation Card */}
                <Card shadow="sm" radius="lg" p="xl" withBorder style={{borderTop: '4px solid #f26522'}}>
                    <SectionTitle>Phân bổ phòng</SectionTitle>
                    
                    <Stack gap={25}>
                        {(reservation.allocations || []).map((allocation, index) => (
                            <Box key={allocation.id}>
                                <Stack gap="xs">
                                    <Group justify="space-between" align="flex-end">
                                        <Text fw={700} c="blue.9" size="sm">
                                            PHÒNG {index + 1} — {getRoomClassName(allocation.roomClassId).toUpperCase()}
                                        </Text>
                                        
                                        <Group gap="xs" align="center">
                                            <Text size="sm" fw={500} c="dimmed">Số phòng:</Text>
                                            <Select
                                                placeholder="Chọn số phòng"
                                                data={availableRoomsByAllocation[allocation.id] || []}
                                                value={assignments[allocation.id]}
                                                onChange={(val) => setAssignments(prev => ({...prev, [allocation.id]: val}))}
                                                style={{width: 140}}
                                                size="sm"
                                                radius="md"
                                                searchable
                                                clearable
                                            />
                                        </Group>
                                    </Group>
                                    
                                    <Paper p="sm" bg="gray.0" radius="md" withBorder style={{borderStyle: 'dashed'}}>
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <IconUser size={16} color="#004a8b" />
                                                <Text size="sm" fw={600} c="blue.8">Phân bổ số lượng:</Text>
                                            </Group>
                                            <Badge variant="filled" size="lg" radius="xs" px="lg" color="blue">
                                                {allocation.numberOfPeople} KHÁCH
                                            </Badge>
                                        </Group>
                                    </Paper>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Card>

                {/* Actual occupants are registered at check-in, not at reservation time. */}
                <Card shadow="sm" radius="lg" p="xl" withBorder style={{borderTop: '4px solid #f26522'}}>
                    <SectionTitle>Thông tin khách lưu trú</SectionTitle>
                    <Text size="sm" c="dimmed" mb="lg">
                        Nhập đầy đủ thông tin của từng người thực tế sử dụng phòng để lập danh sách lưu trú.
                    </Text>
                    <Stack gap="xl">
                        {(reservation.allocations || []).map((allocation, allocationIndex) => (
                            <Box key={allocation.id}>
                                <Group justify="space-between" mb="sm">
                                    <Text fw={700} c="blue.9">
                                        Phòng {assignments[allocation.id]
                                            ? (availableRoomsByAllocation[allocation.id] || []).find((room) => room.value === assignments[allocation.id])?.label
                                            : allocationIndex + 1}
                                        {' — '}{getRoomClassName(allocation.roomClassId)}
                                    </Text>
                                    <Badge color="blue" variant="light">
                                        {(occupants[allocation.id] || []).length} khách
                                    </Badge>
                                </Group>
                                <Stack gap="md">
                                    {(occupants[allocation.id] || []).map((guest, guestIndex) => (
                                        <Paper key={guestIndex} p="md" radius="md" withBorder bg="gray.0">
                                            <Text fw={700} size="sm" mb="sm">Khách {guestIndex + 1}</Text>
                                            <Grid gutter="sm">
                                                <Grid.Col span={{base: 12, sm: 6}}>
                                                    <TextInput
                                                        label="Họ và tên"
                                                        placeholder="Nguyễn Văn A"
                                                        required
                                                        value={guest.guestName}
                                                        onChange={(event) => updateOccupant(allocation.id, guestIndex, 'guestName', event.currentTarget.value)}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{base: 12, sm: 6}}>
                                                    <TextInput
                                                        label="Số điện thoại"
                                                        placeholder="09xxxxxxxx"
                                                        required
                                                        value={guest.phoneNumber}
                                                        onChange={(event) => updateOccupant(allocation.id, guestIndex, 'phoneNumber', event.currentTarget.value)}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{base: 12, sm: 6}}>
                                                    <TextInput
                                                        label="CCCD / Hộ chiếu"
                                                        placeholder="Số giấy tờ tùy thân"
                                                        required
                                                        value={guest.identityDocument}
                                                        onChange={(event) => updateOccupant(allocation.id, guestIndex, 'identityDocument', event.currentTarget.value)}
                                                    />
                                                </Grid.Col>
                                                <Grid.Col span={{base: 12, sm: 6}}>
                                                    <TextInput
                                                        label="Nơi cư trú"
                                                        placeholder="Địa chỉ cư trú"
                                                        required
                                                        value={guest.residence}
                                                        onChange={(event) => updateOccupant(allocation.id, guestIndex, 'residence', event.currentTarget.value)}
                                                    />
                                                </Grid.Col>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Card>

                {/* Footer Actions */}
                <Paper p="lg" radius="xl" bg="gray.1" shadow="xs" mt="md" withBorder>
                    <Group justify="space-between">
                        <Button 
                            variant="white" 
                            color="gray" 
                            size="lg" 
                            px={40} 
                            radius="md"
                            onClick={() => navigate(-1)}
                        >
                            Hủy
                        </Button>
                        <Button 
                            color="blue.8" 
                            size="lg" 
                            px={40} 
                            radius="md"
                            loading={submitting}
                            onClick={handleCheckIn}
                            rightSection={<IconExternalLink size={18} />}
                        >
                            Xác nhận Check-in
                        </Button>
                    </Group>
                </Paper>
            </Stack>
        </Container>
    );
};
