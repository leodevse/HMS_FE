import { createAreaContext } from "./area-factory";
import { createDefaultStay } from "../../../utils/hotelStayPolicy";

/**
 * @type {CustomerRequest}
 */
const customerRequest = {
    identityNumber: "",
    fullName: "",
    phoneNumber: "",
    email: "",
    note: "",
};

/**
 * @returns {RoomClassQuantityRequest}
 */
export const getDefaultRoomClassQuantity = () => {
    return {
        _key: Date.now(),
        roomClassId: null,
        numberOfPeople: 1,
    };
};

/**
 * @type {ReservationRequest}
 */
const defaultStay = createDefaultStay();
const reservationRequest = {
    checkInDate: defaultStay.checkIn.toISOString(),
    checkOutDate: defaultStay.checkOut.toISOString(),
    adults: 1,
    childs: 0,
    customerRequest: customerRequest,
    roomClassQuantities: [getDefaultRoomClassQuantity()],
    note: "",
};

export const { useArea: useMakeReservationArea, Provider: MakeReservationAreaProvider } =
    createAreaContext(reservationRequest);
