// pages/staff/room/ListRoomPage.jsx
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Center,
    Group,
    Divider,
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
import {roomClassApi} from "../../../apis/receptionist/roomClassApi.js";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    {value: "AVAILABLE", label: "Available", color: "teal"},
    {value: "RESERVED", label: "Reserved", color: "blue"},
    {value: "CLEAN", label: "Clean", color: "green"},
    {value: "DIRTY", label: "Dirty", color: "orange"},
    {value: "OCCUPIED", label: "Occupied", color: "red"},
    {value: "MAINTENANCE", label: "Maintenance", color: "gray"},
];

const getStatus = (value) => STATUS_OPTIONS.find((s) => s.value === value);

export const ListRoomPage = () => {
    // --- States ---
    const [roomNumber, setRoomNumber] = useState("");
    const [status, setStatus] = useState(null);
    const [roomClassId, setRoomClassId] = useState(null);

    /** @type {[RoomClassResponse[], React.Dispatch<React.SetStateAction<RoomClassResponse[]>>]} */
    const [roomClasses, setRoomClasses] = useState([]);

    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // --- Biến đổi dữ liệu cho Select (Fix lỗi toLowerCase bằng cách dùng .name) ---
    const roomClassOptions = useMemo(() => {
        if (!Array.isArray(roomClasses)) return [];
        return roomClasses.map((item) => ({
            value: String(item.id),
            label: item.name || `Class ${item.id}`, // Sử dụng 'name' theo RoomClassResponse
        }));
    }, [roomClasses]);

    // --- API Calls ---
    const fetchClasses = useCallback(async () => {
        try {
            const res = await roomClassApi.getAll();
            setRoomClasses(res || []);
        } catch (err) {
            console.error("Failed to fetch room classes", err);
        }
    }, []);

    const fetchData = useCallback(async (rNum, stat, rcId, p) => {
        setLoading(true);
        try {
            // Apply RoomSearchParams phẳng
            const params = {
                roomNumber: rNum || undefined,
                status: stat || undefined,
                roomClassId: rcId || undefined,
                page: p - 1,
                size: PAGE_SIZE,
            };

            const res = await roomApi.getRooms(params);
            setData(res.content ?? []);
            setTotal(res.totalElements ?? 0);
        } catch (err) {
            console.error("Fetch rooms error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        fetchData(roomNumber, status, roomClassId, page);
    }, [page, fetchData]);

    const handleSearch = () => {
        setPage(1);
        fetchData(roomNumber, status, roomClassId, 1);
    };

    const handleView = async (room) => {
        setSelectedRoom(room);
        setDetailLoading(true);
        try {
            setSelectedRoom(await roomApi.getRoomById(room.id));
        } catch (err) {
            console.error("Fetch room detail error:", err);
        } finally {
            setDetailLoading(false);
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    return (
            <Box>
                <Title order={2} fw={600} c="gray.8" mb="lg">Rooms Management</Title>

                {/* Filter Section */}
                <Group gap="sm" mb="md" wrap="wrap" align="flex-end">
                    <TextInput
                            label="Room Number"
                            placeholder="E.g. 101"
                            leftSection={<IconSearch size={15}/>}
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            radius="md" size="sm" style={{minWidth: 150}}
                    />

                    <Select
                            label="Status"
                            placeholder="All statuses"
                            data={STATUS_OPTIONS}
                            value={status}
                            onChange={setStatus}
                            clearable
                            radius="md" size="sm" style={{minWidth: 150}}
                    />

                    <Select
                            label="Room Class"
                            placeholder="All classes"
                            data={roomClassOptions}
                            value={roomClassId}
                            onChange={setRoomClassId}
                            clearable
                            searchable
                            radius="md" size="sm" style={{minWidth: 180}}
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

                {/* Table Section */}
                <Paper radius="md" shadow="xs" withBorder
                       style={{borderColor: "var(--mantine-color-gray-2)", overflowX: "auto"}}>
                    <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover
                           styles={{
                               thead: {backgroundColor: "var(--mantine-color-gray-0)"},
                               th: {color: "var(--mantine-color-gray-6)", fontWeight: 500, fontSize: 13},
                           }}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Room No.</Table.Th>
                                <Table.Th>Room Class</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Active</Table.Th>
                                <Table.Th/>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.length > 0 ? data.map((room) => {
                                const s = getStatus(room.status);
                                return (
                                        <Table.Tr key={room.id}>
                                            <Table.Td>
                                                <Text fw={600} size="sm">{room.roomNumber}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {room.roomClassName || room.roomClass?.className || room.roomClass?.name || "N/A"}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={s?.color ?? "gray"} variant="light" size="sm" radius="xl">
                                                    {s?.label ?? room.status}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={room.isActive ? "teal" : "gray"} variant="light" size="sm"
                                                       radius="xl">
                                                    {room.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Tooltip label="View detail">
                                                    <ActionIcon variant="subtle" color="gray" size="sm"
                                                                onClick={() => handleView(room)}>
                                                        <IconEye size={15}/>
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                );
                            }) : (
                                    <Table.Tr>
                                        <Table.Td colSpan={5}>
                                            <Center py="xl">
                                                <Text c="dimmed" size="sm">
                                                    {loading ? "Loading..." : "No rooms found matching criteria"}
                                                </Text>
                                            </Center>
                                        </Table.Td>
                                    </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* Pagination Section */}
                {total > 0 && (
                        <Group justify="space-between" align="center" mt="md" wrap="wrap" gap="sm">
                            <Text size="xs" c="dimmed">Showing {from}–{to} of {total} records</Text>
                            {totalPages > 1 && (
                                    <Pagination
                                            value={page}
                                            onChange={setPage}
                                            total={totalPages}
                                            color="teal"
                                            radius="md"
                                            size="sm"
                                            withEdges
                                    />
                            )}
                        </Group>
                )}

                <Modal
                        opened={Boolean(selectedRoom)}
                        onClose={() => setSelectedRoom(null)}
                        title="Room details"
                        centered
                        radius="md"
                >
                    {selectedRoom && (
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Room number</Text>
                                        <Title order={3}>{selectedRoom.roomNumber}</Title>
                                    </div>
                                    <Badge
                                            color={getStatus(selectedRoom.status)?.color ?? "gray"}
                                            variant="light"
                                            size="lg"
                                    >
                                        {getStatus(selectedRoom.status)?.label ?? selectedRoom.status}
                                    </Badge>
                                </Group>
                                <Divider/>
                                <SimpleGrid cols={2} spacing="md">
                                    <div>
                                        <Text size="xs" c="dimmed">Room class</Text>
                                        <Text fw={600}>{selectedRoom.roomClassName || "N/A"}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Active</Text>
                                        <Text fw={600}>{selectedRoom.isActive ? "Active" : "Inactive"}</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Standard capacity</Text>
                                        <Text fw={600}>{selectedRoom.roomClass?.standardOccupancy ?? "N/A"} guests</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Maximum capacity</Text>
                                        <Text fw={600}>{selectedRoom.roomClass?.maxOccupancy ?? "N/A"} guests</Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed">Base price</Text>
                                        <Text fw={600}>{selectedRoom.roomClass?.basePrice != null
                                            ? `${Number(selectedRoom.roomClass.basePrice).toLocaleString("vi-VN")} ₫`
                                            : "N/A"}</Text>
                                    </div>
                                </SimpleGrid>
                                <div>
                                    <Text size="xs" c="dimmed">Description</Text>
                                    <Text>{selectedRoom.description || "No description"}</Text>
                                </div>
                                {detailLoading && <Text size="xs" c="dimmed">Refreshing room details...</Text>}
                            </Stack>
                    )}
                </Modal>
            </Box>
    );
};
