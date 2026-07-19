// components/ReservationItem.jsx

import {ActionIcon, Badge, Group, Table, Text} from "@mantine/core";
import {IconEye, IconLogin} from "@tabler/icons-react";
import {RESERVATION_STATUS_MAP} from "../../../constants/reservation.jsx";
import {useNavigate} from "react-router-dom";
import {formatUtils} from "../../../utils/formatUtils.js";
import {RECEPTIONIST_MAP_ROUTES} from "../../../constants/receptionist.jsx";

/**
 * Component để hiển thị một dòng thông tin đặt phòng trong bảng danh sách đặt phòng.
 *
 * @param {{ reservation: ReservationResponse, onView: (reservation: ReservationResponse) => void }} props
 * @returns {React.JSX.Element}
 */
export const ReservationItem = ({reservation}) => {
    const navigate = useNavigate();
    const statusCfg = RESERVATION_STATUS_MAP[reservation.status] ?? {color: "gray", label: reservation.status};

    const viewHandler = () => {
        navigate(`/receptionist/reservations/${reservation.bookingId}`);
    }

    const checkInHandler = () => {
        navigate(`/receptionist/reservations/${reservation.bookingId}/check-in`);
    }

    return (
            <Table.Tr key={reservation.bookingId}>
                <Table.Td>
                    <Text fw={600} size="sm">
                        {reservation.bookingCode}
                    </Text>
                </Table.Td>

                <Table.Td>
                    <Text size="sm">{reservation.customer.fullName}</Text>
                    <Text size="xs" c="dimmed">
                        {reservation.customer.phoneNumber}
                    </Text>
                </Table.Td>

                <Table.Td>
                    <Text size="sm">
                        {reservation.customer.identityCard}
                    </Text>
                </Table.Td>

                <Table.Td>
                    <Text size="sm">{formatUtils.formatDate(reservation.checkInDate, true)}</Text>
                </Table.Td>

                <Table.Td>
                    <Text size="sm">{formatUtils.formatDate(reservation.checkOutDate, true)}</Text>
                </Table.Td>

                <Table.Td>
                    <Text size="sm">{reservation.numberOfMembers}</Text>
                </Table.Td>

                <Table.Td>
                    <Badge color={statusCfg.color} variant="light" size="sm" radius="xl">
                        {statusCfg.label}
                    </Badge>
                </Table.Td>

                <Table.Td>
                    <Group justify="flex-end" gap={4} wrap="nowrap">
                        {/* Nút Check-in chỉ hiện khi trạng thái là CONFIRMED hoặc PENDING_DEPOSIT? Thường là CONFIRMED */}
                        {reservation.status === 'PENDING' && (
                            <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                aria-label="Check-in"
                                onClick={checkInHandler}
                            >
                                <IconLogin size={15}/>
                            </ActionIcon>
                        )}
                        <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                aria-label="View details"
                                onClick={() => viewHandler()}
                        >
                            <IconEye size={15}/>
                        </ActionIcon>
                    </Group>
                </Table.Td>
            </Table.Tr>
    );
};
