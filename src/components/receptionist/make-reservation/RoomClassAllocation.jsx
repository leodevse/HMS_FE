import {ActionIcon, Badge, Button, Group, NumberInput, Select, Stack, Table, Text} from "@mantine/core";
import {IconAlertCircle, IconPlus, IconTrash} from "@tabler/icons-react";
import {useEffect, useMemo, useState} from "react";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi.js";
import {
    getDefaultRoomClassQuantity,
    useMakeReservationArea,
} from "../../../hooks/common/area/make-reservation-area-provider";
import {useObjectState} from "../../../hooks/common/use-object-state";
import {roomClassService} from "../../../services/roomClassService.js";
import {formatUtils} from "../../../utils/formatUtils";
import {SectionCard} from "../../common/SectionCard";

export const RoomClassAllocation = () => {
    const {state: reservationRequest, setState: setReservationRequest, setIsLoading} = useMakeReservationArea();
    const {updateField} = useObjectState(reservationRequest, setReservationRequest);
    const [roomClassAvailabilityResponses, setRoomClassAvailabilityResponses] = useState([]);

    // --- 1. Logic Tính Toán (Computed States) ---
    const roomClasses = useMemo(
            () => roomClassAvailabilityResponses.map((res) => res.roomClass),
            [roomClassAvailabilityResponses],
    );

    const totalAssignedGuests = useMemo(
            () => reservationRequest.roomClassQuantities?.reduce((sum, row) => sum + (row.numberOfPeople || 0), 0) || 0,
            [reservationRequest.roomClassQuantities],
    );

    const diff = reservationRequest.numberOfMembers - totalAssignedGuests;

    const badgeStatus = useMemo(() => {
        if (diff === 0) return {color: "teal", text: `All ${reservationRequest.numberOfMembers} guests assigned`};
        if (diff > 0) return {color: "orange", text: `${diff} guest(s) unassigned`};
        return {color: "red", text: `Over-allocated by ${Math.abs(diff)} guest(s)!`};
    }, [diff, reservationRequest.numberOfMembers]);

    // --- 2. Side Effects ---
    useEffect(() => {
        (async () => {
            if (!reservationRequest.checkInDate || !reservationRequest.checkOutDate) {
                setRoomClassAvailabilityResponses([]);
                return;
            }

            setIsLoading(true);
            try {
                setRoomClassAvailabilityResponses(await roomClassApi.getAvailableRooms(
                        reservationRequest.checkInDate,
                        reservationRequest.checkOutDate,
                ));
            } catch (error) {
                console.error("Failed to load room availability", error);
                setRoomClassAvailabilityResponses([]);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [reservationRequest.checkInDate, reservationRequest.checkOutDate]);

    // --- 3. Handlers ---
    const updateRoomSelection = (rowKey, field, value) => {
        let normalizedValue = value;
        if (field === "numberOfPeople") {
            const row = reservationRequest.roomClassQuantities.find((item) => item._key === rowKey);
            const roomClass = roomClassService.findRoomClassById(roomClasses, row?.roomClassId);
            normalizedValue = Math.max(1, Math.min(Number(value) || 1, roomClass?.maxCapacity || 1));
        }
        updateField(
                "roomClassQuantities",
                reservationRequest.roomClassQuantities.map((row) =>
                        row._key === rowKey ? {...row, [field]: normalizedValue} : row,
                ),
        );
    };

    const removeRoomRow = (rowKey) => {
        updateField(
                "roomClassQuantities",
                reservationRequest.roomClassQuantities.filter((row) => row._key !== rowKey),
        );
    };

    const addNewRoomHandler = () => {
        updateField("roomClassQuantities", [...reservationRequest.roomClassQuantities, getDefaultRoomClassQuantity()]);
    };

    const validateCapacity = (selection) => {
        const roomClass = roomClassService.findRoomClassById(roomClasses, selection.roomClassId);
        if (!roomClass) return null;
        const currentGuests = selection.numberOfPeople || 0;
        if (currentGuests > roomClass.maxCapacity) return {color: "red", text: "Exceeds max capacity!"};
        if (currentGuests > roomClass.standardCapacity) {
            const extra = currentGuests - roomClass.standardCapacity;
            return {
                color: "orange",
                text: `+${extra} guest (Fee: ${formatUtils.formatCurrency(roomClass.extraPersonFee)})`,
            };
        }
        return {color: "teal", text: "Valid capacity"};
    };

    return (
            <SectionCard title="2. Room Class & Allocation">
                {/* BẢNG 1: HIỂN THỊ KHO PHÒNG TRỐNG (REFERENCE TABLE) */}
                {roomClassAvailabilityResponses.length > 0 && (
                        <Stack gap="xs" mb="xl">
                            <Text fw={600} size="xs" c="dimmed" tt="uppercase">Available rooms for selected
                                period</Text>
                            <Table withColumnBorders variant="vertical" layout="fixed">
                                <Table.Thead bg="gray.0">
                                    <Table.Tr>
                                        <Table.Th>Room Class</Table.Th>
                                        <Table.Th w={150}>Price / Night</Table.Th>
                                        <Table.Th w={180}>Capacity (Std/Max)</Table.Th>
                                        <Table.Th w={120}>Available</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {roomClassAvailabilityResponses.map(({roomClass, availableRooms}) => (
                                            <Table.Tr key={roomClass.id}>
                                                <Table.Td size="sm" fw={500}>{roomClass.name}</Table.Td>
                                                <Table.Td
                                                        size="sm">{formatUtils.formatCurrency(roomClass.basePrice)}</Table.Td>
                                                <Table.Td
                                                        size="sm">{roomClass.standardCapacity} / {roomClass.maxCapacity} guests</Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                            color={availableRooms > 0 ? "teal" : "red"}
                                                            variant="light"
                                                            fullWidth
                                                    >
                                                        {availableRooms} rooms
                                                    </Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Stack>
                )}

                {/* BẢNG 2: PHÂN BỔ PHÒNG (ALLOCATION FORM) */}
                <Stack gap="xs">
                    <Text fw={600} size="xs" c="dimmed" tt="uppercase">Room Allocation</Text>
                    <Table horizontalSpacing="md" verticalSpacing="xs">
                        <Table.Thead bg="gray.0">
                            <Table.Tr>
                                <Table.Th w={50}>#</Table.Th>
                                <Table.Th>Room Class</Table.Th>
                                <Table.Th w={150}>Guests / Room</Table.Th>
                                <Table.Th>Status & Surcharge</Table.Th>
                                <Table.Th w={60}/>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {reservationRequest.roomClassQuantities?.map((row, idx) => {

                                // A. Lọc Options (Ẩn nếu đã chọn hết, nhưng giữ lại cái đang chọn)
                                const filteredOptions = roomClassAvailabilityResponses
                                        .map((res) => {
                                            const usedInOtherRows = reservationRequest.roomClassQuantities
                                                    .filter((r) => r._key !== row._key && r.roomClassId === String(res.roomClass.id))
                                                    .length;
                                            const remaining = res.availableRooms - usedInOtherRows;
                                            return {
                                                value: String(res.roomClass.id),
                                                label: `${res.roomClass.name} (${Math.max(0, remaining)} available)`,
                                                remaining: remaining,
                                                disabled: remaining <= 0 && String(res.roomClass.id) !== row.roomClassId,
                                            };
                                        })
                                        ;

                                // B. Check Out of Stock (Lỗi sau khi fetch data)
                                const currentRCRes = roomClassAvailabilityResponses.find(r => String(r.roomClass.id) === row.roomClassId);
                                const totalRowsThisClass = reservationRequest.roomClassQuantities.filter(r => r.roomClassId === row.roomClassId).length;
                                const isError = row.roomClassId && currentRCRes && (totalRowsThisClass > currentRCRes.availableRooms);

                                // C. Tính Max Guests
                                let dynamicMax = 1;
                                if (row.roomClassId) {
                                    const currentRC = roomClassService.findRoomClassById(roomClasses, row.roomClassId);
                                    const otherRoomsTotal = reservationRequest.roomClassQuantities
                                            .filter((r) => r._key !== row._key)
                                            .reduce((sum, r) => sum + (r.numberOfPeople || 0), 0);
                                    const guestLimit = reservationRequest.numberOfMembers - otherRoomsTotal;
                                    dynamicMax = Math.max(1, Math.min(Math.max(1, guestLimit), currentRC?.maxCapacity || 1));
                                }

                                return (
                                        <Table.Tr key={row._key}
                                                  style={isError ? {backgroundColor: 'var(--mantine-color-red-0)'} : {}}>
                                            <Table.Td><Text size="sm">{idx + 1}</Text></Table.Td>
                                            <Table.Td>
                                                <Select
                                                        data={filteredOptions}
                                                        value={row.roomClassId}
                                                        onChange={(val) => updateRoomSelection(row._key, "roomClassId", val)}
                                                        placeholder="Select room class"
                                                        radius="md"
                                                        error={isError ? "No more rooms available" : false}
                                                        leftSection={isError &&
                                                                <IconAlertCircle size={16} color="red"/>}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <NumberInput
                                                        value={row.numberOfPeople}
                                                        onChange={(val) => updateRoomSelection(row._key, "numberOfPeople", val)}
                                                        min={1}
                                                        max={dynamicMax}
                                                        radius="md"
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                {isError ? (
                                                        <Text size="xs" c="red" fw={700}>REQUIRED: Change class</Text>
                                                ) : validateCapacity(row) ? (
                                                        <Text size="xs" c={validateCapacity(row).color}
                                                              fw={500}>{validateCapacity(row).text}</Text>
                                                ) : (
                                                        <Text size="xs" c="dimmed">—</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        onClick={() => removeRoomRow(row._key)}
                                                        disabled={reservationRequest.roomClassQuantities?.length === 1}
                                                >
                                                    <IconTrash size={16}/>
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>

                    <Group justify="space-between" mt="sm">
                        <Button
                                variant="outline"
                                leftSection={<IconPlus size={14}/>}
                                size="xs"
                                onClick={addNewRoomHandler}
                                disabled={diff <= 0}
                        >
                            Add another room
                        </Button>
                        <Badge variant="dot" color={badgeStatus.color} size="lg">
                            {badgeStatus.text}
                        </Badge>
                    </Group>
                </Stack>
            </SectionCard>
    );
};
