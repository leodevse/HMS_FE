// components/.../DateTimeSection.jsx
import {Button, Grid, Group, NumberInput, Text} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {IconCalendar, IconUsers} from "@tabler/icons-react";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {SectionCard} from "../../common/SectionCard";
import {formatUtils} from "../../../utils/formatUtils";
import {getMinimumCheckOut} from '../../../utils/hotelStayPolicy';

export const DateTimeSection = () => {
    const {
        state: reservationRequest,
        setState: setReservationRequest,
        isLoading,
        forceRefetchKey,
    } = useMakeReservationArea();

    const {checkInDate, checkOutDate, adults, childs} = reservationRequest;
    const totalMembers = (Number(adults) || 0) + (Number(childs) || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minCheckOutDate = checkInDate
            ? getMinimumCheckOut(checkInDate)
            : getMinimumCheckOut(today);

    const updateField = (field, value) => {
        setReservationRequest((prev) => ({...prev, [field]: value}));
    };

    const handleCheckAvailability = () => {
        setReservationRequest((prev) => ({
            ...prev,
            checkInDate,
            checkOutDate,
            adults: Number(adults) || 1,
            childs: Number(childs) || 0,
        }));
        if (typeof forceRefetchKey === "function") forceRefetchKey();
    };

    return (
            <SectionCard title="1. Reservation Information">
                <Grid gutter="md" align="flex-end">
                    <Grid.Col span={{base: 12, sm: 4}}>
                        <DateTimePicker
                                label="Check-in"
                                placeholder="Select date & time"
                                value={checkInDate ? new Date(checkInDate) : null}
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
                                disabled={isLoading}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 4}}>
                        <DateTimePicker
                                label="Check-out"
                                placeholder="Select date & time"
                                value={checkOutDate ? new Date(checkOutDate) : null}
                                minDate={minCheckOutDate}
                                onChange={(value) => updateField("checkOutDate", formatUtils.formatDateISO(value))}
                                leftSection={<IconCalendar size={15}/>}
                                valueFormat="DD/MM/YYYY HH:mm"
                                radius="md"
                                disabled={isLoading}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 6, sm: 2}}>
                        <NumberInput
                                label="Adults"
                                value={adults}
                                onChange={(value) => {
                                    const v = Math.max(1, Math.min(3, Number(value) || 1));
                                    updateField("adults", v);
                                }}
                                min={1}
                                max={3}
                                radius="md"
                                disabled={isLoading}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 6, sm: 2}}>
                        <NumberInput
                                label="Childs"
                                value={childs}
                                onChange={(value) => {
                                    const v = Math.max(0, Math.min(2, Number(value) || 0));
                                    updateField("childs", v);
                                }}
                                min={0}
                                max={2}
                                radius="md"
                                disabled={isLoading}
                        />
                    </Grid.Col>
                </Grid>

                <Group justify="flex-end" mt="md">
                    <Text size="sm" c="dimmed">Total guests: <b>{totalMembers}</b></Text>
                    <Button
                            onClick={handleCheckAvailability}
                            disabled={!checkInDate || !checkOutDate}
                            loading={isLoading}
                            variant="filled"
                            color="blue"
                            radius="md"
                            leftSection={<IconUsers size={16}/>}
                    >
                        Check Available
                    </Button>
                </Group>
            </SectionCard>
    );
};
