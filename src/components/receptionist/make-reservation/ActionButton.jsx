import {useNavigate} from "react-router-dom";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {reservationApi} from "../../../apis/receptionist/reservationApi";
import {Button, Group, Modal, Text} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconCheck, IconX} from "@tabler/icons-react";
import {RECEPTIONIST_MAP_ROUTES} from "../../../constants/receptionist.jsx";
import {useDisclosure} from "@mantine/hooks";
import {useMemo, useState} from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFormEmpty = (reservationRequest) => {
    const cr = reservationRequest.customerRequest || {};
    const noteEmpty = !reservationRequest.note && !cr.note;
    return (
        (!cr.fullName || !cr.fullName.trim()) &&
        (!cr.phoneNumber || !cr.phoneNumber.trim()) &&
        (!cr.email || !cr.email.trim()) &&
        (!cr.identityNumber || !cr.identityNumber.trim()) &&
        noteEmpty &&
        (!reservationRequest.roomClassQuantities ||
                reservationRequest.roomClassQuantities.every((r) => !r.roomClassId))
    );
};

export const ActionButton = ({isEditMode = false, reservationId}) => {
    const navigate = useNavigate();
    const {state: reservationRequest} = useMakeReservationArea();
    const [submitting, setSubmitting] = useState(false);
    const [cancelOpened, {open: openCancel, close: closeCancel}] = useDisclosure(false);

    const totalMembers = (Number(reservationRequest.adults) || 0) + (Number(reservationRequest.childs) || 0);

    const totalAssigned = useMemo(
            () => (reservationRequest.roomClassQuantities || []).reduce((s, r) => s + (r.numberOfPeople || 0), 0),
            [reservationRequest.roomClassQuantities],
    );

    const allRoomsAssigned = totalAssigned === totalMembers && totalMembers > 0;
    const allRowsHaveRoom = (reservationRequest.roomClassQuantities || []).every((r) => r.roomClassId);
    const customerValid =
            reservationRequest.customerRequest?.fullName?.trim() &&
            reservationRequest.customerRequest?.phoneNumber?.trim() &&
            (!reservationRequest.customerRequest?.email || EMAIL_REGEX.test(reservationRequest.customerRequest.email));

    const canSubmit = allRoomsAssigned && allRowsHaveRoom && customerValid;

    const cancelHandler = () => {
        if (isFormEmpty(reservationRequest)) {
            navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
        } else {
            openCancel();
        }
    };

    const confirmCancel = () => {
        closeCancel();
        navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            if (isEditMode && reservationId) {
                // Update existing reservation
                await reservationApi.updateReservation(reservationId, reservationRequest);
                notifications.show({
                    color: 'green',
                    title: 'Success',
                    message: `Reservation updated successfully`,
                });
                navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
            } else {
                // Create new reservation
                const reservationResponse = await reservationApi.makeReservation({
                    ...reservationRequest,
                    numberOfMembers: totalMembers,
                });
                if (reservationResponse) {
                    notifications.show({
                        color: 'green',
                        title: 'Success',
                        message: `Reservation ${reservationResponse.bookingCode || reservationResponse.id} created`,
                    });
                    navigate(RECEPTIONIST_MAP_ROUTES.RESERVATIONS.path);
                }
            }
        } catch (error) {
            notifications.show({
                color: 'red',
                title: isEditMode ? 'Unable to update reservation' : 'Unable to create reservation',
                message: error?.response?.data?.message || error.message || 'Please check the entered information',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
            <>
                <Group justify="flex-end" mt="xl">
                    <Button variant="outline" color="gray" leftSection={<IconX size={16}/>} onClick={cancelHandler}>
                        Cancel
                    </Button>
                    <Button
                            loading={submitting}
                            color="teal"
                            size="md"
                            radius="md"
                            leftSection={<IconCheck size={16}/>}
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                    >
                        {isEditMode ? "Update Reservation" : "Make Reservation"}
                    </Button>
                </Group>

                <Modal opened={cancelOpened} onClose={closeCancel} title="Confirm cancel" centered>
                    <Text size="sm" mb="md">
                        {isEditMode
                            ? "Are you sure you want to discard changes and return to the reservation list?"
                            : "The form has unsaved data. Are you sure you want to discard and return to the reservation list?"
                        }
                    </Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeCancel}>Keep editing</Button>
                        <Button color="red" onClick={confirmCancel}>Yes, discard</Button>
                    </Group>
                </Modal>
            </>
    );
};
