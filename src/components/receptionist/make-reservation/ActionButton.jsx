import {useNavigate} from "react-router-dom";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {reservationApi} from "../../../apis/receptionist/reservationApi";
import {Button, Group} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconCheck, IconX} from "@tabler/icons-react";
import {RECEPTIONIST_MAP_ROUTES} from "../../../constants/receptionist.jsx";
import {useState} from "react";

export const ActionButton = () => {
    const navigate = useNavigate();
    const {state: reservationRequest} = useMakeReservationArea();
    const [submitting, setSubmitting] = useState(false);

    const cancelHandler = () => {
        navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
    };

    const submitHandler = async () => {
        setSubmitting(true);
        try {
            const reservationResponse = await reservationApi.makeReservation(reservationRequest);
            if (reservationResponse) {
                notifications.show({ color: 'green', title: 'Success', message: `Reservation ${reservationResponse.bookingCode} created` });
                navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
            }
        } catch (error) {
            notifications.show({
                color: 'red',
                title: 'Unable to create reservation',
                message: error?.response?.data?.message || error.message || 'Please check the entered information',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
            <Group justify="flex-end" mt="xl">
                <Button variant="subtle" color="gray" leftSection={<IconX size={16}/>} onClick={cancelHandler}>
                    Cancel
                </Button>
                <Button loading={submitting} color="teal" size="md" radius="md" leftSection={<IconCheck size={16}/>} onClick={submitHandler}>
                    Confirm Reservation
                </Button>
            </Group>
    );
};
