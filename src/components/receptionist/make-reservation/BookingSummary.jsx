import {Divider, Stack} from "@mantine/core";
import {useEffect, useMemo, useState} from "react";
import {roomClassApi} from "../../../apis/receptionist/roomClassApi.js";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {roomClassService} from "../../../services/roomClassService";
import {dateUtils} from "../../../utils/dateUtils";
import {formatUtils} from "../../../utils/formatUtils";
import {SectionCard} from "../../common/SectionCard";
import {SummaryRow} from "../../common/SummaryRow.jsx";
import {getStaySurchargeRates} from '../../../utils/hotelStayPolicy';

/**
 * Tính tổng tiền phòng, phụ phí và đặt cọc dựa trên lựa chọn của khách
 *
 * @param {RoomClassQuantityRequest[]} selectedRooms - Danh sách các phòng đã chọn với số lượng khách
 * @param {RoomClassResponse[]} roomClasses - Danh sách hạng phòng có sẵn để lấy giá và sức chứa
 * @param {number} nights - Số đêm lưu trú để tính tổng tiền
 */
const calculateBookingSummary = (selectedRooms, roomClasses, nights, checkIn, checkOut) => {
    if ((!selectedRooms || selectedRooms.length === 0 || roomClasses.length === 0 || nights <= 0)) {
        return {roomCharge: 0, surcharge: 0, total: 0, deposit: 0};
    }

    /**
     * Tính tiền phòng và phụ phí cho một dòng phòng cụ thể dựa trên loại phòng và số khách
     *
     * @param {RoomClassQuantityRequest} selectedRoom - Lựa chọn phòng cụ thể với roomClassId và số khách
     * @return {Object} - Trả về object chứa roomCharge và surcharge cho dòng phòng đó
     */
    const getTotalAmountForRoom = (selectedRoom) => {
        const roomClass = roomClassService.findRoomClassById(roomClasses, selectedRoom.roomClassId);
        if (!roomClass) return {roomCharge: 0, surcharge: 0};

        const extraGuests = Math.max(0, (selectedRoom.numberOfPeople || 0) - roomClass.standardCapacity);

        return {
            roomCharge: roomClass.basePrice * nights,
            surcharge: extraGuests * roomClass.extraPersonFee * nights,
        };
    };

    const {roomCharge, surcharge} = selectedRooms.reduce(
            (acc, room) => {
                const {roomCharge, surcharge} = getTotalAmountForRoom(room);
                acc.roomCharge += roomCharge;
                acc.surcharge += surcharge;
                return acc;
            },
            {roomCharge: 0, surcharge: 0},
    );

    const firstNightCharge = selectedRooms.reduce((sum, selectedRoom) => {
        const roomClass = roomClassService.findRoomClassById(roomClasses, selectedRoom.roomClassId);
        return sum + (roomClass?.basePrice || 0);
    }, 0);
    const rates = getStaySurchargeRates(checkIn, checkOut);
    const timeSurcharge = firstNightCharge * (rates.earlyCheckIn + rates.lateCheckOut);
    const total = roomCharge + surcharge + timeSurcharge;
    const deposit = Math.round(total * 0.2);
    return {roomCharge, surcharge, timeSurcharge, total, deposit, rates};
};

export const BookingSummary = () => {
    const {state: reservationRequest} = useMakeReservationArea();
    /**
     * @type {[RoomClassAvailabilityResponse[], React.Dispatch<React.SetStateAction<RoomClassAvailabilityResponse[]>>]}
     */
    const [roomClassAvailabilityResponses, setRoomClassAvailabilityResponses] = useState([]);

    const roomClasses = useMemo(
            () => roomClassAvailabilityResponses.map((res) => res.roomClass),
            [roomClassAvailabilityResponses],
    );

    useEffect(() => {
        (async () => {
            // Kiểm tra nếu check-in hoặc check-out chưa có thì không gọi API
            if (!reservationRequest.checkInDate || !reservationRequest.checkOutDate) {
                setRoomClassAvailabilityResponses([]); // Reset dữ liệu nếu ngày chưa đầy đủ
                return;
            }

            const response = await roomClassApi.getAvailableRooms(
                    reservationRequest.checkInDate,
                    reservationRequest.checkOutDate,
            );
            setRoomClassAvailabilityResponses(response);
        })();
    }, [reservationRequest, setRoomClassAvailabilityResponses]);

    /* ── Dữ liệu tính toán (Computed values) ── */
    const stayNights = dateUtils.dateDiff(reservationRequest.checkInDate, reservationRequest.checkOutDate);
    const bookingSummary = calculateBookingSummary(
            reservationRequest.roomClassQuantities ?? [],
            roomClasses,
            stayNights,
            reservationRequest.checkInDate,
            reservationRequest.checkOutDate,
    );

    return (
            <SectionCard title="4. Booking Summary">
                <Stack gap={8}>
                    <SummaryRow
                            label={`Room charge (${reservationRequest.roomClassQuantities?.length} room(s) × ${stayNights} night(s))`}
                            value={formatUtils.formatCurrency(bookingSummary.roomCharge)}
                    />
                    {bookingSummary.surcharge > 0 && (
                            <SummaryRow
                                    label="Extra guest surcharge"
                                    value={formatUtils.formatCurrency(bookingSummary.surcharge)}
                                    color="orange"
                            />
                    )}
                    {bookingSummary.timeSurcharge > 0 && (
                            <SummaryRow
                                    label={`Early/Late time surcharge (${Math.round((bookingSummary.rates.earlyCheckIn + bookingSummary.rates.lateCheckOut) * 100)}%)`}
                                    value={formatUtils.formatCurrency(bookingSummary.timeSurcharge)}
                                    color="orange"
                            />
                    )}
                    <Divider my="xs"/>
                    <SummaryRow label="TOTAL" value={formatUtils.formatCurrency(bookingSummary.total)} bold size="lg"/>
                    <SummaryRow
                            label="Deposit required (20%)"
                            value={formatUtils.formatCurrency(bookingSummary.deposit)}
                            color="teal"
                    />
                </Stack>
            </SectionCard>
    );
};
