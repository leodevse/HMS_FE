// components/.../DateTimeSection.jsx
import {Button, Grid, Group, NumberInput, Text} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {IconCalendar, IconUsers} from "@tabler/icons-react";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {useObjectState} from "../../../hooks/common/use-object-state";
import {SectionCard} from "../../common/SectionCard";
import {formatUtils} from "../../../utils/formatUtils";
import {getMinimumCheckOut} from '../../../utils/hotelStayPolicy';

export const DateTimeSection = () => {
    // Giải nén thêm 'isLoading' từ Area Context đã được phen nâng cấp
    const {
        state: reservationRequest,
        setState: setReservationRequest,
        isLoading
    } = useMakeReservationArea();

    const {data: localReservationRequest, updateField} = useObjectState(reservationRequest);
    const {checkInDate, checkOutDate, numberOfMembers} = localReservationRequest;

    // 1. Tạo mốc thời gian "hôm nay"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Logic cho Check-out: Phải sau Check-in 1 ngày
    const minCheckOutDate = checkInDate
            ? getMinimumCheckOut(checkInDate)
            : getMinimumCheckOut(today);

    const handleCheckAvailability = () => {
        // Lưu ý: Logic gọi API fetch nên nằm ở Provider hoặc thông qua useEffect lắng nghe sự thay đổi của Request
        setReservationRequest((prev) => ({
            ...prev,
            checkInDate,
            checkOutDate,
            numberOfMembers,
        }));
    };

    return (
            <SectionCard title="1. Date & Time">
                <Text size="xs" c="dimmed" mb="sm">Standard hotel time: check-in 14:00, check-out 12:00 next day. Early check-in and late check-out may incur a surcharge.</Text>
                <Grid gutter="md" align="flex-end">
                    <Grid.Col span={{base: 12, sm: 4}}>
                        <DateTimePicker
                                label="Check-in Date"
                                placeholder="Select date & time"
                                value={checkInDate ? new Date(checkInDate) : null} // Đảm bảo truyền đối tượng Date
                                minDate={today}
                                onChange={(value) => {
                                    updateField("checkInDate", formatUtils.formatDateISO(value));
                                    if (value && (!checkOutDate || new Date(checkOutDate) < getMinimumCheckOut(value))) {
                                        updateField("checkOutDate", formatUtils.formatDateISO(getMinimumCheckOut(value)));
                                    }
                                }}
                                leftSection={<IconCalendar size={15}/>}
                                valueFormat="DD/MM/YYYY HH:mm"
                                radius="md"
                                // Disable input khi đang fetch để tránh thay đổi data giữa chừng
                                disabled={isLoading}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 4}}>
                        <DateTimePicker
                                label="Check-out Date"
                                placeholder="Select date & time"
                                value={checkOutDate ? new Date(checkOutDate) : null} // Đảm bảo truyền đối tượng Date
                                minDate={minCheckOutDate}
                                onChange={(value) => updateField("checkOutDate", formatUtils.formatDateISO(value))}
                                leftSection={<IconCalendar size={15}/>}
                                valueFormat="DD/MM/YYYY HH:mm"
                                radius="md"
                                disabled={isLoading}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 4}}>
                        <Group align="flex-end" grow>
                            <NumberInput
                                    label="Total Guests"
                                    value={numberOfMembers}
                                    onChange={(value) => {
                                        updateField("numberOfMembers", value);
                                        // Update thẳng vào area state nếu muốn phản hồi ngay lập tức
                                        setReservationRequest((prev) => ({
                                            ...prev,
                                            numberOfMembers: value,
                                        }));
                                    }}
                                    min={1}
                                    leftSection={<IconUsers size={15}/>}
                                    radius="md"
                                    disabled={isLoading}
                            />
                            <Button
                                    onClick={handleCheckAvailability}
                                    // Nút chỉ bấm được khi có đủ ngày và KHÔNG trong trạng thái isLoading
                                    disabled={!checkInDate || !checkOutDate}
                                    loading={isLoading} // <--- Hiệu ứng xoay vòng mặc định cực mượt
                                    variant="filled"
                                    color="blue"
                                    radius="md"
                            >
                                Check Available
                            </Button>
                        </Group>
                    </Grid.Col>
                </Grid>
            </SectionCard>
    );
};
