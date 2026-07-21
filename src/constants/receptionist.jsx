import {BedDouble, CalendarDays, CreditCard, LogIn, LogOut, Users} from "lucide-react";
import {ReservationListPage} from "../pages/receptionist/reservation/ReservationListPage.jsx";
import {MakeReservationPage} from "../pages/receptionist/reservation/MakeReservationPage.jsx";
import {CheckInPage} from "../pages/receptionist/reservation/CheckInPage.jsx";
import {ListRoomPage} from "../pages/receptionist/room/ListRoomPage.jsx";
import {ListRoomOccupantPage} from "../pages/receptionist/room/ListRoomOccupantPage.jsx";
import {ComingSoonPage} from "../pages/common/ComingSoonPage.jsx";
import {ReservationDetailPage} from "../pages/receptionist/reservation/ReservationDetailPage.jsx";
import {CheckoutListPage} from "../pages/receptionist/checkout/CheckoutListPage.jsx";
import {CheckoutPage} from "../pages/receptionist/checkout/CheckoutPage.jsx";

/** @type {Object.<string, RouteItemType>} */
const RECEPTIONIST_MAP_ROUTES = {
    RESERVATIONS: {
        path: "/receptionist/reservations",
        label: "Reservation",
        icon: CalendarDays,
        element: <ReservationListPage/>,
        inNavbar: true,
    },
    RESERVATION_DETAIL: {
        path: "/receptionist/reservations/:id",
        element: <ReservationDetailPage/>
    },
    RESERVATION_EDIT: {
        path: "/receptionist/reservations/:id/edit",
        label: "Edit Reservation",
        element: <MakeReservationPage isEditMode={true} reservationIdFromRoute={true} />,
    },
    CHECK_IN_ID: {
        path: "/receptionist/reservations/:id/check-in",
        element: <CheckInPage/>
    },
    MAKE_RESERVATION: {
        path: "/receptionist/reservations/make",
        element: <MakeReservationPage/>,
    },
    ROOMS: {
        path: "/receptionist/rooms",
        label: "Room",
        icon: BedDouble,
        element: <ListRoomPage/>,
        inNavbar: true,
    },
    OCCUPIED_ROOMS: {
        path: "/receptionist/occupied-rooms",
        label: "Occupied Room",
        icon: Users,
        element: <ListRoomOccupantPage/>,
        inNavbar: true,
    },
    CHECK_IN: {
        path: "/receptionist/check-in",
        label: "Check-in",
        icon: LogIn,
        element: <ComingSoonPage/>,
        inNavbar: true,
    },
    CHECK_OUT: {
        path: "/receptionist/check-out",
        label: "Check-out",
        icon: LogOut,
        element: <CheckoutListPage/>,
        inNavbar: true,
    },
    CHECK_OUT_ID: {
        path: "/receptionist/reservations/:id/check-out",
        element: <CheckoutPage/>,
    },
    PAYMENT: {
        path: "/receptionist/payment",
        label: "Payment",
        icon: CreditCard,
        element: <CheckoutListPage/>,
        inNavbar: true,
    },
};

/**
 * @type {RouteItemType[]}
 */
const RECEPTIONIST_ROUTES = Object.values(RECEPTIONIST_MAP_ROUTES);

const RECEPTIONIST_NAVBAR_ITEMS = RECEPTIONIST_ROUTES.filter((item) => item.inNavbar);

export {RECEPTIONIST_MAP_ROUTES, RECEPTIONIST_ROUTES, RECEPTIONIST_NAVBAR_ITEMS};
