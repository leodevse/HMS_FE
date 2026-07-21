import {Divider, Group, Stack, Text} from "@mantine/core";
import {useEffect, useMemo, useState} from "react";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi.js";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {roomClassService} from "../../../services/roomClassService";
import {dateUtils} from "../../../utils/dateUtils";
import {formatUtils} from "../../../utils/formatUtils";
import {SectionCard} from "../../common/SectionCard";
import {SummaryRow} from "../../common/SummaryRow.jsx";
import {getStaySurchargeRates} from '../../../utils/hotelStayPolicy';

const calculateRoomBreakdown = (selectedRooms, roomClasses, nights) => {
    if (!selectedRooms || selectedRooms.length === 0 || !roomClasses || roomClasses.length === 0 || nights <= 0) {
        return [];
    }

    return selectedRooms
            .filter((room) => room.roomClassId)
            .map((room) => {
                const roomClass = roomClassService.findRoomClassById(roomClasses, room.roomClassId);
                if (!roomClass) return null;
                const extraGuests = Math.max(0, (room.numberOfPeople || 0) - roomClass.standardCapacity);
                const roomCharge = roomClass.basePrice * nights;
                const surcharge = extraGuests * roomClass.extraPersonFee * nights;
                return {
                    roomClassName: roomClass.name,
                    roomCharge,
                    surcharge,
                    extraGuests,
                    numberOfPeople: room.numberOfPeople || 0,
                    standardCapacity: roomClass.standardCapacity,
                    nights,
                };
            })
            .filter(Boolean);
};

export const BookingSummary = () => {
    const {state: reservationRequest, refetchKey} = useMakeReservationArea();
    const [roomClassAvailabilityResponses, setRoomClassAvailabilityResponses] = useState([]);

    const roomClasses = useMemo(
            () => roomClassAvailabilityResponses.map((res) => res.roomClass),
            [roomClassAvailabilityResponses],
    );

    useEffect(() => {
        (async () => {
            if (!reservationRequest.checkInDate || !reservationRequest.checkOutDate) {
                setRoomClassAvailabilityResponses([]);
                return;
            }

            const response = await roomClassApi.getAvailableRooms(
                    reservationRequest.checkInDate,
                    reservationRequest.checkOutDate,
                    reservationRequest.reservationId || null,
            );
            setRoomClassAvailabilityResponses(response);
        })();
    }, [reservationRequest.checkInDate, reservationRequest.checkOutDate, reservationRequest.reservationId, refetchKey]);

    const stayNights = dateUtils.dateDiff(reservationRequest.checkInDate, reservationRequest.checkOutDate);
    const roomBreakdown = useMemo(
            () => calculateRoomBreakdown(
                    reservationRequest.roomClassQuantities ?? [],
                    roomClasses,
                    stayNights,
            ),
            [reservationRequest.roomClassQuantities, roomClasses, stayNights],
    );

    const totalRoomCharge = roomBreakdown.reduce((sum, r) => sum + r.roomCharge, 0);
    const totalSurcharge = roomBreakdown.reduce((sum, r) => sum + r.surcharge, 0);

    const rates = getStaySurchargeRates(reservationRequest.checkInDate, reservationRequest.checkOutDate);
    const timeSurcharge = totalRoomCharge * (rates.earlyCheckIn + rates.lateCheckOut);
    const grandTotal = totalRoomCharge + totalSurcharge + timeSurcharge;
    const deposit = Math.round(grandTotal * 0.2);

    return (
            <SectionCard title="4. Summary">
                <Stack gap={8}>
                    {roomBreakdown.length > 0 ? (
                            <>
                                {roomBreakdown.map((room, idx) => (
                                        <Group key={idx} justify="space-between" wrap="nowrap">
                                            <Stack gap={2} style={{flex: 1}}>
                                                <Text size="sm" fw={500}>
                                                    {room.roomClassName}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {room.nights} night(s) × {formatUtils.formatCurrency(room.roomClass?.basePrice ?? 0)}
                                                    {room.extraGuests > 0 && ` + ${room.extraGuests} extra person(s)`}
                                                </Text>
                                            </Stack>
                                            <Stack gap={2} align="flex-end">
                                                <Text size="sm" fw={500}>{formatUtils.formatCurrency(room.roomCharge)}</Text>
                                                {room.surcharge > 0 && (
                                                        <Text size="xs" c="orange">
                                                            + {formatUtils.formatCurrency(room.surcharge)}
                                                        </Text>
                                                )}
                                            </Stack>
                                        </Group>
                                ))}
                                <Divider my="xs"/>
                                <Group justify="space-between">
                                    <Text size="sm" fw={600}>Room charge</Text>
                                    <Text size="sm" fw={600}>{formatUtils.formatCurrency(totalRoomCharge)}</Text>
                                </Group>
                            </>
                    ) : (
                            <Text size="sm" c="dimmed">Select rooms to see pricing</Text>
                    )}

                    {totalSurcharge > 0 && (
                            <Group justify="space-between">
                                <Text size="sm" c="orange">Extra person surcharge</Text>
                                <Text size="sm" c="orange">+ {formatUtils.formatCurrency(totalSurcharge)}</Text>
                            </Group>
                    )}

                    {timeSurcharge > 0 && (
                            <Group justify="space-between">
                                <Text size="sm" c="orange">
                                    Time surcharge ({Math.round((rates.earlyCheckIn + rates.lateCheckOut) * 100)}%)
                                </Text>
                                <Text size="sm" c="orange">+ {formatUtils.formatCurrency(timeSurcharge)}</Text>
                            </Group>
                    )}

                    <Divider my="xs"/>
                    <Group justify="space-between">
                        <Text size="md" fw={700}>Total</Text>
                        <Text size="md" fw={700}>{formatUtils.formatCurrency(grandTotal)}</Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="teal" fw={500}>Deposit (20%)</Text>
                        <Text size="sm" c="teal" fw={500}>{formatUtils.formatCurrency(deposit)}</Text>
                    </Group>
                </Stack>
            </SectionCard>
    );
};
