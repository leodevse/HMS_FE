import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Group,
    Modal,
    Pagination,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from "@mantine/core";
import {IconEye, IconSearch} from "@tabler/icons-react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {roomApi} from "../../../apis/receptionist/roomApi.js";
import {ROOM_STATUS} from "../../../constants/housekeeping.js";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi.js";

const PAGE_SIZE = 10;

export const ListRoomOccupantPage = () => {
    // --- States ---
    const [roomNumber, setRoomNumber] = useState("");
    const [roomClassId, setRoomClassId] = useState(null);

    /**
     * @type {[RoomClassResponse[], React.Dispatch<React.SetStateAction<RoomClassResponse[]>>]}
     */
    const [roomClasses, setRoomClasses] = useState(
            /** @type {RoomClassResponse[]} */
            []
    );

    const [page, setPage] = useState(1);
    /**
     *  @type {[RoomResponse[], React.Dispatch<React.SetStateAction<RoomResponse[]>>]}
     */
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [registeredGuests, setRegisteredGuests] = useState([]);
    const [guestLoading, setGuestLoading] = useState(false);

    // --- Biến đổi dữ liệu cho Select ---
    // Tách riêng để đảm bảo luôn có thuộc tính 'value' (string) và 'label'
    const roomClassOptions = useMemo(() => {
        if (!Array.isArray(roomClasses)) return [];
        return roomClasses.map((item) => ({
            value: String(item.id),
            label: item.name || `Class ${item.id}`,
        }));
    }, [roomClasses]);

    // --- API Calls ---
    const fetchClasses = useCallback(async () => {
        try {
            const res = await roomClassApi.getAll();
            setRoomClasses(res || []);
        } catch (err) {
            console.error("Failed to fetch room classes", err);
            setRoomClasses([]);
        }
    }, []);

    const fetchData = useCallback(async (rNum, rcId, p) => {
        setLoading(true);
        try {
            const params = {
                roomNumber: rNum || undefined,
                roomClassId: rcId || undefined,
                status: ROOM_STATUS.OCCUPIED.value,
                page: p - 1,
                size: PAGE_SIZE,
            };

            const res = await roomApi.getOccupiedRooms(params);
            setData(res.content ?? []);
            setTotal(res.totalElements ?? 0);
        } catch (err) {
            console.error("Fetch occupants error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        fetchData(roomNumber, roomClassId, page);
    }, [page, fetchData]);

    const handleSearch = () => {
        setPage(1);
        fetchData(roomNumber, roomClassId, 1);
    };

    const formatDate = (value) => value
            ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${String(value).slice(0, 10)}T00:00:00`))
            : "---";

    const handleView = async (room) => {
        setSelectedRoom(room);
        setRegisteredGuests([]);
        setGuestLoading(true);
        try {
            setRegisteredGuests(await roomApi.getRoomOccupants(room.reservationRoomId));
        } catch (error) {
            console.error("Failed to fetch registered occupants", error);
        } finally {
            setGuestLoading(false);
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    return (
            <Box>
                <Title order={2} fw={600} c="gray.8" mb="lg">Room Occupants</Title>

                {/* Filter Section */}
                <Group gap="sm" mb="md" align="flex-end">
                    <TextInput
                            label="Room Number"
                            placeholder="E.g. 101"
                            leftSection={<IconSearch size={15}/>}
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            radius="md" size="sm" style={{width: 180}}
                    />

                    <Select
                            label="Room Class"
                            placeholder="All classes"
                            data={roomClassOptions} // Sử dụng biến đã tách riêng
                            value={roomClassId}
                            onChange={setRoomClassId}
                            clearable
                            searchable
                            nothingFoundMessage="No classes found"
                            radius="md" size="sm" style={{width: 200}}
                    />

                    <Button
                            leftSection={<IconSearch size={15}/>}
                            color="teal"
                            radius="md" size="sm"
                            loading={loading}
                            onClick={handleSearch}
                    >
                        Search
                    </Button>
                </Group>

                {/* Table */}
                <Paper radius="md" shadow="xs" withBorder
                       style={{borderColor: "var(--mantine-color-gray-2)", overflowX: "auto"}}>
                    <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover
                           styles={{
                               thead: {backgroundColor: "var(--mantine-color-gray-0)"},
                               th: {color: "var(--mantine-color-gray-6)", fontWeight: 500, fontSize: 13},
                           }}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Room</Table.Th>
                                <Table.Th>Class</Table.Th>
                                <Table.Th>Booking Code</Table.Th>
                                <Table.Th>Guest</Table.Th>
                                <Table.Th>Stay Dates</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th/>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.length > 0 ? data.map((r) => (
                                    <Table.Tr key={r.id}>
                                        {/* 1. Room Number */}
                                        <Table.Td>
                                            <Text fw={700} size="sm" c="teal">{r.roomNumber}</Text>
                                        </Table.Td>

                                        {/* 2. Room Class */}
                                        <Table.Td>
                                            <Text size="sm">{r.roomClassName || "N/A"}</Text>
                                        </Table.Td>

                                        {/* 3. Booking Code - Gọi trực tiếp từ r */}
                                        <Table.Td>
                                            <Text fw={600} size="sm">
                                                {r.bookingCode || "N/A"}
                                            </Text>
                                        </Table.Td>

                                        {/* 4. Guest Info - Gọi trực tiếp guestFullName và guestPhoneNumber */}
                                        <Table.Td>
                                            <Box>
                                                <Text size="sm">{r.guestFullName || "No Guest"}</Text>
                                                <Text size="xs" c="dimmed">{r.guestPhoneNumber || ""}</Text>
                                            </Box>
                                        </Table.Td>

                                        {/* 5. Stay Dates - Gọi trực tiếp checkInDate và checkOutDate */}
                                        <Table.Td>
                                            <Box>
                                                <Text size="xs" fw={500}>
                                                    In: {formatDate(r.checkInDate)}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    Out: {formatDate(r.checkOutDate)}
                                                </Text>
                                            </Box>
                                        </Table.Td>

                                        {/* 6. Status */}
                                        <Table.Td>
                                            <Badge
                                                    color={r.status === 'OCCUPIED' ? "teal" : "gray"}
                                                    variant="light"
                                                    size="sm"
                                                    radius="xl"
                                            >
                                                {r.status || "Occupied"}
                                            </Badge>
                                        </Table.Td>

                                        {/* 7. Action */}
                                        <Table.Td>
                                            <Tooltip label="View detail">
                                                <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        size="sm"
                                                        onClick={() => handleView(r)}
                                                >
                                                    <IconEye size={15}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                            )) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={7}>
                                            <Center py="xl">
                                                <Text c="dimmed" size="sm">
                                                    {loading ? "Loading..." : "No occupied rooms found"}
                                                </Text>
                                            </Center>
                                        </Table.Td>
                                    </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* Pagination */}
                {total > 0 && (
                        <Group justify="space-between" align="center" mt="md" wrap="wrap" gap="sm">
                            <Text size="xs" c="dimmed">Showing {from}–{to} of {total} records</Text>
                            {totalPages > 1 && (
                                    <Pagination value={page} onChange={setPage} total={totalPages} color="teal"
                                                radius="md" size="sm" withEdges/>
                            )}
                        </Group>
                )}

                <Modal
                        opened={Boolean(selectedRoom)}
                        onClose={() => setSelectedRoom(null)}
                        title="Occupied room details"
                        centered
                        radius="md"
                        size="lg"
                >
                    {selectedRoom && (
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Room</Text>
                                        <Title order={3}>{selectedRoom.roomNumber}</Title>
                                    </div>
                                    <Badge color="teal" variant="light" size="lg">Occupied</Badge>
                                </Group>
                                <Divider/>
                                <SimpleGrid cols={{base: 1, sm: 2}} spacing="md">
                                    <div>
                                        <Text size="xs" c="dimmed">Room class</Text>
                                        <Text fw={600}>{selectedRoom.roomClassName || "N/A"}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Booking code</Text>
                                        <Text fw={600}>{selectedRoom.bookingCode || "N/A"}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Guest</Text>
                                        <Text fw={600}>{selectedRoom.guestFullName || "N/A"}</Text>
                                        {selectedRoom.guestPhoneNumber && <Text size="sm" c="dimmed">{selectedRoom.guestPhoneNumber}</Text>}
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Stay period</Text>
                                        <Text fw={600}>{formatDate(selectedRoom.checkInDate)} – {formatDate(selectedRoom.checkOutDate)}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Standard capacity</Text>
                                        <Text fw={600}>{selectedRoom.roomClass?.standardOccupancy ?? "N/A"} guests</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Maximum capacity</Text>
                                        <Text fw={600}>{selectedRoom.roomClass?.maxOccupancy ?? "N/A"} guests</Text>
                                    </div>
                                </SimpleGrid>
                                <div>
                                    <Text size="xs" c="dimmed">Description</Text>
                                    <Text>{selectedRoom.description || "No description"}</Text>
                                </div>
                                <Divider label="Registered occupants" labelPosition="left"/>
                                {guestLoading ? (
                                    <Text size="sm" c="dimmed">Loading occupants...</Text>
                                ) : registeredGuests.length > 0 ? (
                                    <Stack gap="sm">
                                        {registeredGuests.map((guest, index) => (
                                            <Paper key={guest.id} p="sm" withBorder radius="md">
                                                <Text fw={700}>Guest {index + 1}: {guest.guestName}</Text>
                                                <SimpleGrid cols={{base: 1, sm: 2}} mt="xs">
                                                    <Text size="sm"><b>Phone:</b> {guest.phoneNumber}</Text>
                                                    <Text size="sm"><b>ID/Passport:</b> {guest.identityDocument}</Text>
                                                </SimpleGrid>
                                                <Text size="sm" mt="xs"><b>Residence:</b> {guest.residence}</Text>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Text size="sm" c="dimmed">No occupant information has been registered.</Text>
                                )}
                            </Stack>
                    )}
                </Modal>
            </Box>
    );
};
