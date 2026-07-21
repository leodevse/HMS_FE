// pages/staff/MakeReservationPage.jsx

import {Box, Loader, Stack, Text, Title} from "@mantine/core";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ActionButton} from "../../../components/receptionist/make-reservation/ActionButton.jsx";
import {BookingSummary} from "../../../components/receptionist/make-reservation/BookingSummary.jsx";
import {CustomerInfo} from "../../../components/receptionist/make-reservation/CustomerInfo.jsx";
import {DateTimeSection} from "../../../components/receptionist/make-reservation/DateTimeSection.jsx";
import {RoomClassAllocation} from "../../../components/receptionist/make-reservation/RoomClassAllocation.jsx";
import {
    MakeReservationAreaProvider,
    useMakeReservationArea,
} from "../../../hooks/common/area/make-reservation-area-provider.jsx";
import {reservationApi, transformReservationForEdit} from "../../../apis/receptionist/reservationApi";
import {notifications} from "@mantine/notifications";

// Separate component that loads data when in edit mode
const EditModeLoader = ({reservationId}) => {
    const {setState} = useMakeReservationArea();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!reservationId) return;

        (async () => {
            try {
                const reservation = await reservationApi.getReservationById(reservationId);
                if (!reservation) {
                    setError('Reservation not found');
                    setLoading(false);
                    return;
                }

                if (reservation.status !== 'PENDING') {
                    notifications.show({
                        color: 'red',
                        title: 'Cannot edit',
                        message: 'Only PENDING reservations can be modified.',
                    });
                    setError('Only PENDING reservations can be modified');
                    setLoading(false);
                    return;
                }

                const formData = transformReservationForEdit(reservation);
                if (formData) {
                    // Build the complete state structure
                    const newState = {
                        id: formData.id,
                        bookingCode: formData.bookingCode,
                        status: formData.status,
                        checkInDate: formData.checkInDate,
                        checkOutDate: formData.checkOutDate,
                        adults: formData.adults,
                        childs: formData.childs,
                        numberOfMembers: formData.numberOfMembers,
                        reservationId: Number(reservationId),
                        customerRequest: {
                            customerId: formData.customerRequest.customerId,
                            fullName: formData.customerRequest.fullName || '',
                            phoneNumber: formData.customerRequest.phoneNumber || '',
                            email: formData.customerRequest.email || '',
                            identityNumber: formData.customerRequest.identityNumber || '',
                        },
                        roomClassQuantities: formData.roomClassQuantities || [],
                        note: formData.note || '',
                    };
                    setState(newState);
                }
                setLoading(false);
            } catch (err) {
                console.error('Failed to load reservation:', err);
                setError('Failed to load reservation data');
                setLoading(false);
            }
        })();
    }, [reservationId, setState]);

    if (loading) {
        return (
            <Stack align="center" gap="md" py="xl">
                <Loader size="lg" />
                <Text c="dimmed">Loading reservation data...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack align="center" gap="md" py="xl">
                <Text c="red">{error}</Text>
            </Stack>
        );
    }

    return null; // Let main form render
};

export const MakeReservationPage = () => {
    const params = useParams();

    // Check if this is edit mode based on URL
    const isEditMode = params.id !== undefined && params.id !== 'make';
    const editReservationId = params.id;

    const title = isEditMode ? "Modify Reservation" : "Create new Reservation";

    return (
        <Box maw={1000} mx="auto" py="xl" px="md">
            <Title order={2} fw={800} ta="center" mb="xl" c="blue.9">
                {title}
            </Title>
            <MakeReservationAreaProvider>
                {isEditMode && editReservationId && <EditModeLoader reservationId={editReservationId} />}
                <Stack gap="lg">
                    <DateTimeSection />
                    <RoomClassAllocation />
                    <CustomerInfo />
                    <BookingSummary />
                    <ActionButton isEditMode={isEditMode} reservationId={editReservationId} />
                </Stack>
            </MakeReservationAreaProvider>
        </Box>
    );
};
