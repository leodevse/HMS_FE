import { createListContext } from "./list-factory";

/**
 * @type {ReservationSearchParams}
 */
const initialSearchParams = {
    page: 0,
    size: 10,
};

/**
 * @type {PageResponse<ReservationResponse>}
 */
const initialPage = {};

/**
 * @type {ListFactoryType<PageResponse<ReservationResponse>, ReservationSearchParams>}
 */
export const { useList: useReservationList, Provider: ReservationProvider } = createListContext(
    initialSearchParams,
    initialPage,
);