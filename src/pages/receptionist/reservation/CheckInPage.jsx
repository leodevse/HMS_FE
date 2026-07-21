import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Grid,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import {IconArrowLeft, IconCheck, IconId, IconTrash} from "@tabler/icons-react";
import {reservationApi} from "../../../apis/receptionist/reservationApi";
import {roomApi} from "../../../apis/receptionist/roomApi";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi";
import {formatUtils} from "../../../utils/formatUtils";
import {notifications} from "@mantine/notifications";

const ROLE_OPTIONS = [
    {value: "OWNER", label: "Owner"},
    {value: "MEMBER", label: "Member"},
];

const STANDARD_CHECKIN_HOUR = 14;

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
        if (id) fetchInitialData();
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

                // Rule: Only show Clean (VC) status rooms
                const roomOptions = (rooms || [])
                    .filter(r => !r.status || r.status === 'CLEAN' || r.status === 'VC' || r.status === 'AVAILABLE')
                    .map(r => ({
                        value: r.id.toString(),
                        label: r.roomNumber
                    }));

                if (allocation.roomId && !roomOptions.find(opt => opt.value === allocation.roomId.toString())) {
                    roomOptions.push({
                        value: allocation.roomId.toString(),
                        label: allocation.roomNumber || `Room ${allocation.roomId}`
                    });
                }

                availableRoomsMap[allocation.id] = roomOptions;
                initialAssignments[allocation.id] = allocation.roomId ? allocation.roomId.toString() : null;
            });

            await Promise.all(fetchPromises);
            setAvailableRoomsByAllocation(availableRoomsMap);
            setAssignments(initialAssignments);

            // Initialize occupants: first is Owner, rest are Members
            setOccupants(Object.fromEntries((resDetail.allocations || []).map((allocation) => {
                const count = Math.max(Number(allocation.numberOfPeople) || 1, 1);
                return [
                    allocation.id,
                    Array.from({length: count}, (_, idx) => ({
                        role: idx === 0 ? "OWNER" : "MEMBER",
                        guestName: "",
                        identityDocument: "",
                    }))
                ];
            })));
        } catch (error) {
            console.error("Failed to load check-in data", error);
            notifications.show({
                title: "Error",
                message: "Failed to load reservation or available rooms",
                color: "red"
            });
        } finally {
            setLoading(false);
        }
    };

    // Check time logic: Early arrival if before 14:00 of check-in day
    const timeStatus = useMemo(() => {
        const scheduledCheckIn = reservation?.checkInDate ? new Date(reservation.checkInDate) : null;
        if (!scheduledCheckIn) return {isValid: true, label: "(Valid)", color: "green", isTooEarly: false};

        const scheduledHour = scheduledCheckIn.getHours();
        const currentHour = currentTime.getHours();
        const isEarly = currentHour < STANDARD_CHECKIN_HOUR && scheduledHour <= STANDARD_CHECKIN_HOUR;

        return {
            isValid: !isEarly,
            label: isEarly ? "Early Arrival" : "(Valid)",
            color: isEarly ? "red" : "green",
            isTooEarly: isEarly,
            surcharge: isEarly ? "Early check-in surcharge may apply" : null,
        };
    }, [reservation, currentTime]);

    const updateOccupant = (allocationId, guestIndex, field, value) => {
        setOccupants((current) => ({
            ...current,
            [allocationId]: (current[allocationId] || []).map((guest, index) =>
                index === guestIndex ? {...guest, [field]: value} : guest
            ),
        }));
    };

    const addOccupant = (allocationId) => {
        setOccupants((current) => ({
            ...current,
            [allocationId]: [...(current[allocationId] || []), {role: "MEMBER", guestName: "", identityDocument: ""}],
        }));
    };

    const removeOccupant = (allocationId, guestIndex) => {
        const list = occupants[allocationId] || [];
        // Cannot delete if it's the only Owner
        const guest = list[guestIndex];
        if (guest?.role === "OWNER") {
            const ownerCount = list.filter(g => g.role === "OWNER").length;
            if (ownerCount <= 1) {
                notifications.show({
                    title: "Cannot delete",
                    message: "Each room must have at least one Owner.",
                    color: "orange",
                });
                return;
            }
        }
        setOccupants((current) => ({
            ...current,
            [allocationId]: list.filter((_, i) => i !== guestIndex),
        }));
    };

    const handleScanIdentityCard = (allocationId, guestIndex) => {
        // Placeholder for actual scanner integration
        notifications.show({
            title: "Scanner",
            message: "Card scanner not connected. Please enter information manually.",
            color: "blue",
        });
    };

    // Validation: each room must have at least one Owner with Identity ID
    const isFormValid = useMemo(() => {
        if (!reservation?.allocations) return false;

        // All rooms assigned
        const allAssigned = reservation.allocations.every(a => assignments[a.id]);
        if (!allAssigned) return false;

        // Each room has at least one Owner with Identity ID
        const allOwnersValid = reservation.allocations.every((allocation) => {
            const roomOccupants = occupants[allocation.id] || [];
            const owners = roomOccupants.filter(g => g.role === "OWNER");
            return owners.length > 0 && owners.every(o => o.guestName.trim() && o.identityDocument.trim());
        });

        // All owners have Name
        const allNamesValid = reservation.allocations.every((allocation) => {
            const roomOccupants = occupants[allocation.id] || [];
            return roomOccupants.every(g => g.guestName.trim());
        });

        return allOwnersValid && allNamesValid;
    }, [reservation, assignments, occupants]);

    const handleCheckIn = async () => {
        if (!isFormValid) return;

        setSubmitting(true);
        try {
            const checkInRequest = {
                roomAssignments: (reservation.allocations || []).map((allocation) => ({
                    reservationRoomId: Number(allocation.id),
                    roomId: Number(assignments[allocation.id]),
                    occupants: (occupants[allocation.id] || []).map((guest) => ({
                        guestName: guest.guestName.trim(),
                        role: guest.role,
                        identityDocument: guest.identityDocument.trim() || null,
                    })),
                })),
            };
            await reservationApi.checkInReservation(id, checkInRequest);
            notifications.show({
                title: "Success",
                message: "Check-in successful!",
                color: "green",
                icon: <IconCheck size={16}/>
            });
            navigate("/receptionist/reservations");
        } catch (error) {
            console.error("Check-in failed", error);
            notifications.show({
                title: "Check-in failed",
                message: error.response?.data?.message || "System error occurred",
                color: "red"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getRoomClassName = (classId) => {
        return roomClasses.find(rc => rc.id === classId)?.name || `Room Class ${classId}`;
    };

    if (loading) {
        return (
                <Container py="xl" ta="center">
                    <Loader size="lg" variant="dots"/>
                    <Text mt="md" c="dimmed">Loading check-in information...</Text>
                </Container>
        );
    }

    if (!reservation) {
        return (
                <Container py={80} ta="center">
                    <Paper p="xl" withBorder shadow="sm" radius="md">
                        <Text fw={600} size="xl" color="red">Reservation not found</Text>
                        <Button variant="light" mt="xl" size="lg" onClick={() => navigate(-1)}>
                            Back to list
                        </Button>
                    </Paper>
                </Container>
        );
    }

    return (
            <Container size="lg" py="xl">
                {/* Header */}
                <Group justify="space-between" mb="xl">
                    <Group>
                        <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} onClick={() => navigate(-1)}>
                            Back
                        </Button>
                        <Title order={2} fw={800}>Check-in</Title>
                    </Group>
                    <Badge size="xl" color="blue" variant="filled">
                        {reservation.bookingCode}
                    </Badge>
                </Group>

                <Stack gap="lg">
                    {/* 1. Reservation Information */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Text fw={700} size="md" mb="md" c="dark">Reservation Information</Text>
                        <Grid gutter="md">
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Reservation Code:</Text>
                                    <Text size="sm" fw={700} c="dark">{reservation.bookingCode}</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Reservation Holder:</Text>
                                    <Text size="sm" fw={700} c="dark">{reservation.customer?.fullName || "—"}</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Identity ID:</Text>
                                    <Text size="sm" fw={700} c="dark">{reservation.identityCard || reservation.customer?.identityCard || "—"}</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Check-in:</Text>
                                    <Text size="sm" fw={600} c="dark">{formatUtils.formatDate(reservation.checkInDate, true)}</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Check-out:</Text>
                                    <Text size="sm" fw={600} c="dark">{formatUtils.formatDate(reservation.checkOutDate, true)}</Text>
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 4}}>
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="sm" fw={500} c="dark">Current Time:</Text>
                                    <Text size="sm" fw={700} c="dark">
                                        {formatUtils.formatDate(currentTime, true)}
                                    </Text>
                                    <Text size="sm" c={timeStatus.color} fw={500}>
                                        {timeStatus.label}
                                    </Text>
                                </Group>
                                {timeStatus.surcharge && (
                                        <Text size="xs" c="red" mt={2}>{timeStatus.surcharge}</Text>
                                )}
                            </Grid.Col>
                        </Grid>
                        <Group justify="flex-end" mt="md">
                            <Button
                                    variant="outline"
                                    leftSection={<IconId size={16}/>}
                                    onClick={() => {
                                        notifications.show({
                                            title: "Scanner",
                                            message: "Card scanner not connected. Please enter information manually.",
                                            color: "blue",
                                        });
                                    }}
                                    size="sm"
                                    radius="md"
                            >
                                Scan Identity Card
                            </Button>
                        </Group>
                    </Card>

                    {/* 2. Room Allocation & Guests */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Text fw={700} size="md" mb="md" c="blue.9">Room Allocation</Text>

                        <Stack gap="xl">
                            {(reservation.allocations || []).map((allocation, index) => {
                                const cleanRooms = availableRoomsByAllocation[allocation.id] || [];
                                const noCleanRoom = cleanRooms.length === 0;

                                return (
                                        <Box key={allocation.id}>
                                            <Group justify="space-between" mb="sm" align="flex-end">
                                                <Stack gap={2}>
                                                    <Text fw={700} c="blue.9" size="sm">
                                                        Selected Room {index + 1}: {getRoomClassName(allocation.roomClassId)}
                                                    </Text>
                                                    <Group gap="xs" align="center">
                                                        <Text size="sm" fw={500} c="dimmed">Assign Room:</Text>
                                                        <Select
                                                                placeholder="Select physical room"
                                                                data={cleanRooms}
                                                                value={assignments[allocation.id]}
                                                                onChange={(val) => setAssignments(prev => ({...prev, [allocation.id]: val}))}
                                                                style={{width: 200}}
                                                                size="sm"
                                                                radius="md"
                                                                searchable
                                                                clearable
                                                        />
                                                        {noCleanRoom && (
                                                                <Text size="xs" c="red" fw={500}>No clean room available</Text>
                                                        )}
                                                    </Group>
                                                </Stack>
                                                <Badge color="blue" variant="light" size="lg">
                                                    {(occupants[allocation.id] || []).length} guests
                                                </Badge>
                                            </Group>

                                            {/* Guest Table */}
                                            <Table withColumnBorders withTableBorder mt="sm" layout="fixed">
                                                <Table.Thead bg="blue.0">
                                                    <Table.Tr>
                                                        <Table.Th w={140}>Role</Table.Th>
                                                        <Table.Th>Name</Table.Th>
                                                        <Table.Th w={200}>Identity ID</Table.Th>
                                                        <Table.Th w={260}>Actions</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {(occupants[allocation.id] || []).map((guest, guestIndex) => (
                                                            <Table.Tr key={guestIndex}>
                                                                <Table.Td>
                                                                    <Select
                                                                            data={ROLE_OPTIONS}
                                                                            value={guest.role}
                                                                            onChange={(val) => updateOccupant(allocation.id, guestIndex, 'role', val)}
                                                                            size="xs"
                                                                            radius="md"
                                                                            allowDeselect={false}
                                                                    />
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <TextInput
                                                                            placeholder="Full name (max 100 chars)"
                                                                            value={guest.guestName}
                                                                            onChange={(e) => updateOccupant(allocation.id, guestIndex, 'guestName', e.currentTarget.value)}
                                                                            maxLength={100}
                                                                            size="xs"
                                                                            radius="md"
                                                                    />
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <TextInput
                                                                            placeholder={guest.role === "OWNER" ? "Required (max 20)" : "Optional (max 20)"}
                                                                            value={guest.identityDocument}
                                                                            onChange={(e) => updateOccupant(allocation.id, guestIndex, 'identityDocument', e.currentTarget.value)}
                                                                            maxLength={20}
                                                                            size="xs"
                                                                            radius="md"
                                                                            required={guest.role === "OWNER"}
                                                                    />
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <Group gap={4}>
                                                                        <Button
                                                                                size="xs"
                                                                                variant="outline"
                                                                                leftSection={<IconId size={12}/>}
                                                                                onClick={() => handleScanIdentityCard(allocation.id, guestIndex)}
                                                                        >
                                                                            Scan
                                                                        </Button>
                                                                        <Button
                                                                                size="xs"
                                                                                variant="outline"
                                                                                color="red"
                                                                                leftSection={<IconTrash size={12}/>}
                                                                                onClick={() => removeOccupant(allocation.id, guestIndex)}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </Group>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>

                                            <Group justify="flex-start" mt="sm">
                                                <Button
                                                        size="xs"
                                                        variant="outline"
                                                        onClick={() => addOccupant(allocation.id)}
                                                >
                                                    + Add guest
                                                </Button>
                                            </Group>
                                        </Box>
                                );
                            })}
                        </Stack>
                    </Card>

                    {/* 3. Footer Actions */}
                    <Paper p="lg" radius="md" bg="gray.1" withBorder>
                        <Group justify="space-between">
                            <Button
                                    variant="outline"
                                    color="gray"
                                    size="md"
                                    radius="md"
                                    onClick={() => navigate("/receptionist/reservations")}
                            >
                                Cancel
                            </Button>
                            <Button
                                    color="blue"
                                    size="md"
                                    radius="md"
                                    leftSection={<IconCheck size={16}/>}
                                    loading={submitting}
                                    disabled={!isFormValid}
                                    onClick={handleCheckIn}
                            >
                                Confirm Check-in
                            </Button>
                        </Group>
                    </Paper>
                </Stack>
            </Container>
    );
};