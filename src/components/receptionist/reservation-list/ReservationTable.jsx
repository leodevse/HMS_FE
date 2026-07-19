// components/ReservationTable.jsx
// Table displays reservation list

import {Center, Paper, Table, Text} from "@mantine/core";
import {useEffect} from "react";
import {ReservationItem} from "./ReservationItem.jsx";
import {reservationApi} from "../../../apis/receptionist/reservationApi.js";
import {useReservationList} from "../../../hooks/common/list/reservation-list-provider.jsx";

export const ReservationTable = () => {
    const {page: reservationPageResponse, setPage, searchParams, setIsLoading} = useReservationList();

    useEffect(() => {
        (
                async () => {
                    setIsLoading(true);
                    try {
                        setPage(await reservationApi.getReservations(searchParams));
                    } finally {
                        setIsLoading(false);
                    }
                }
        )();
    }, [searchParams, setPage, setIsLoading]);

    /**
     * @type {ReservationResponse[]}
     */
    const reservations = reservationPageResponse?.content ?? [];

    return (
            <Paper
                    radius="md"
                    shadow="xs"
                    withBorder
                    style={{borderColor: "var(--mantine-color-gray-2)", overflowX: "auto"}}
            >
                <Table
                        horizontalSpacing="md"
                        verticalSpacing="sm"
                        highlightOnHover
                        styles={{
                            thead: {backgroundColor: "var(--mantine-color-gray-0)"},
                            th: {
                                color: "var(--mantine-color-gray-6)",
                                fontWeight: 500,
                                fontSize: 13,
                            },
                        }}
                >
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Code</Table.Th>
                            <Table.Th>Customer</Table.Th>
                            <Table.Th>Identity Card</Table.Th>
                            <Table.Th>Check-in</Table.Th>
                            <Table.Th>Check-out</Table.Th>
                            <Table.Th>Number of members</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th/>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {reservations.length > 0 ? (
                                reservations.map((reservation) => (
                                        <ReservationItem
                                                key={reservation.bookingId}
                                                reservation={reservation}
                                        />
                                ))
                        ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7}>
                                        <Center py="xl">
                                            <Text c="dimmed" size="sm">
                                                Không có dữ liệu
                                            </Text>
                                        </Center>
                                    </Table.Td>
                                </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>
    );
};
