import {Button, Grid, Group, Stack, Textarea, Text, TextInput} from "@mantine/core";
import {customerApi} from "../../../apis/receptionist/customerApi";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {SectionCard} from "../../common/SectionCard";
import {IconSearch} from "@tabler/icons-react";
import {useState} from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]*$/;

export const CustomerInfo = () => {
    const {
        state: reservationRequest,
        setState: setReservationRequest,
        loading: isAreaLoading,
    } = useMakeReservationArea();

    const [isSearching, setIsSearching] = useState(false);

    const customerRequest = reservationRequest.customerRequest || {};

    const updateCustomerRequest = (field, value) => {
        setReservationRequest((prev) => ({
            ...prev,
            customerRequest: {
                ...prev.customerRequest,
                [field]: value,
            },
        }));
    };

    const searchCustomerHandler = async () => {
        const identity = customerRequest.identityNumber?.trim();
        const phone = customerRequest.phoneNumber?.trim();
        if (!identity && !phone) {
            alert("Please enter Identity Number or Phone Number to search.");
            return;
        }

        setIsSearching(true);
        try {
            const keyword = identity || phone;
            const found = await customerApi.searchCustomer(keyword);
            if (found) {
                setReservationRequest((prev) => ({
                    ...prev,
                    customerRequest: {
                        ...prev.customerRequest,
                        customerId: found.id,
                        fullName: found.fullName,
                        phoneNumber: found.phoneNumber,
                        email: found.email,
                        identityNumber: found.identityCard ?? found.identityNumber ?? prev.customerRequest.identityNumber,
                    },
                }));
            } else {
                alert("Customer not found. Please enter customer details manually.");
            }
        } catch (error) {
            console.error("Search customer error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const updateNote = (value) => {
        setReservationRequest((prev) => ({
            ...prev,
            note: value,
        }));
    };

    const emailError = customerRequest.email && !EMAIL_REGEX.test(customerRequest.email);
    const phoneError = customerRequest.phoneNumber && !PHONE_REGEX.test(customerRequest.phoneNumber);

    return (
            <SectionCard title="3. Customer Information">
                <Grid gutter="md">
                    <Grid.Col span={{base: 12, sm: 7}}>
                        <Stack gap="sm">
                            <Group gap="xs" align="flex-end">
                                <TextInput
                                        label="Identity Number"
                                        placeholder="ID Card / Passport (max 20 chars)"
                                        value={customerRequest.identityNumber || ""}
                                        onChange={(e) => updateCustomerRequest("identityNumber", e.currentTarget.value)}
                                        onKeyDown={(e) => e.key === "Enter" && searchCustomerHandler()}
                                        maxLength={20}
                                        style={{flex: 1}}
                                        radius="md"
                                        disabled={isSearching || isAreaLoading}
                                />
                                <Button
                                        variant="light"
                                        onClick={searchCustomerHandler}
                                        leftSection={<IconSearch size={16}/>}
                                        loading={isSearching}
                                        disabled={isAreaLoading}
                                >
                                    Search
                                </Button>
                            </Group>

                            <TextInput
                                    label="Name"
                                    placeholder="Full name (max 100 chars)"
                                    value={customerRequest.fullName || ""}
                                    onChange={(e) => updateCustomerRequest("fullName", e.currentTarget.value)}
                                    maxLength={100}
                                    radius="md"
                                    required
                                    disabled={isSearching || isAreaLoading}
                            />

                            <TextInput
                                    label="Phone Number"
                                    placeholder="Numbers only (max 15)"
                                    value={customerRequest.phoneNumber || ""}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value;
                                        if (PHONE_REGEX.test(v)) {
                                            updateCustomerRequest("phoneNumber", v);
                                        }
                                    }}
                                    maxLength={15}
                                    radius="md"
                                    required
                                    error={phoneError ? "Only numbers allowed" : false}
                                    disabled={isSearching || isAreaLoading}
                            />

                            <TextInput
                                    label="Email"
                                    placeholder="example@email.com"
                                    value={customerRequest.email || ""}
                                    onChange={(e) => updateCustomerRequest("email", e.currentTarget.value)}
                                    maxLength={50}
                                    radius="md"
                                    error={emailError ? "Invalid email format" : false}
                                    disabled={isSearching || isAreaLoading}
                            />
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 5}}>
                        <Textarea
                                label="Note"
                                placeholder="Special requests (max 500 chars)"
                                value={reservationRequest.note || ""}
                                onChange={(e) => updateNote(e.currentTarget.value)}
                                maxLength={500}
                                minRows={7}
                                radius="md"
                                disabled={isSearching || isAreaLoading}
                        />
                        <Text size="xs" c="dimmed" ta="right" mt={4}>
                            {(reservationRequest.note || "").length}/500
                        </Text>
                    </Grid.Col>
                </Grid>
            </SectionCard>
    );
};
