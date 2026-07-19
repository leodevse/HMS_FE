// components/BookingPagination.jsx
import { Group, Pagination, Text } from "@mantine/core";
import { useObjectState } from "../../../hooks/common/use-object-state.jsx";
import { useReservationList } from "../../../hooks/common/list/reservation-list-provider.jsx";

export const ReservationPagination = () => {
    const { searchParams, setSearchParams, page: reservationPageResponse } = useReservationList();
    const { updateField } = useObjectState(searchParams, setSearchParams);

    const { page = 0, size: pageSize = 10 } = searchParams;
    const { totalElements: total = 0 } = reservationPageResponse || {};

    // Tính toán tổng số trang, tối thiểu là 1 để UI luôn có cái hiển thị
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    const from = total === 0 ? 0 : page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, total);

    return (
        <Group justify="space-between" align="center" mt="md" wrap="wrap" gap="sm">
            <Text size="xs" c="dimmed">
                Showing {from}–{to} / {total} records
            </Text>

            <Pagination
                // UI hiển thị cần từ 1
                value={page + 1}
                // Chuyển trang
                onChange={(uiPage) => updateField("page", uiPage - 1)}
                total={totalPages}
                // Nếu chỉ có 1 trang hoặc không có record nào thì có thể disable hoặc cứ để đó
                // disabled={total === 0}
                color="teal"
                radius="md"
                size="sm"
                siblings={1}
                boundaries={1}
                withEdges
            />
        </Group>
    );
};
