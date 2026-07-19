// pages/staff/MakeReservationPage.jsx

import {Box, Stack, Title} from "@mantine/core";
import {ActionButton} from "../../../components/receptionist/make-reservation/ActionButton.jsx";
import {BookingSummary} from "../../../components/receptionist/make-reservation/BookingSummary.jsx";
import {CustomerInfo} from "../../../components/receptionist/make-reservation/CustomerInfo.jsx";
import {DateTimeSection} from "../../../components/receptionist/make-reservation/DateTimeSection.jsx";
import {RoomClassAllocation} from "../../../components/receptionist/make-reservation/RoomClassAllocation.jsx";
import {MakeReservationAreaProvider} from "../../../hooks/common/area/make-reservation-area-provider.jsx";

export const MakeReservationPage = () => {
    return (
            <Box maw={1000} mx="auto" py="xl" px="md">
                <Title order={2} fw={800} ta="center" mb="xl" c="blue.9">
                    CREATE NEW RESERVATION
                </Title>
                <MakeReservationAreaProvider>
                    <Stack gap="lg">
                        {/* SECTION 1: Date & Time */}
                        <DateTimeSection/>

                        {/* SECTION 2: Room Class & Allocation */}
                        <RoomClassAllocation/>

                        {/* SECTION 3: Customer Information */}
                        <CustomerInfo/>

                        {/* SECTION 4: Booking Summary */}
                        <BookingSummary/>

                        {/* ACTION BUTTONS */}
                        <ActionButton/>
                    </Stack>
                </MakeReservationAreaProvider>
            </Box>
    );
};
