import {Button, Grid, Group, Stack, Textarea, TextInput} from "@mantine/core";
import {customerApi} from "../../../apis/receptionist/customerApi";
import {useMakeReservationArea} from "../../../hooks/common/area/make-reservation-area-provider";
import {useObjectState} from "../../../hooks/common/use-object-state";
import {SectionCard} from "../../common/SectionCard";
import {IconSearch} from "@tabler/icons-react";
import {useState} from "react"; // Thêm useState

export const CustomerInfo = () => {
    // loading này dùng để đồng bộ với trạng thái chung của cả Area
    const {
        state: reservationRequest,
        setState: setReservationRequest,
        loading: isAreaLoading
    } = useMakeReservationArea();

    // State loading nội bộ cho riêng việc search khách hàng
    const [isSearching, setIsSearching] = useState(false);

    const {
        data: customerRequest,
        updateField,
    } = useObjectState(reservationRequest.customerRequest);

    const {updateField: updateReservationRequest} = useObjectState(reservationRequest);

    const updateCustomerRequest = (field, value) => {
        updateField(field, value);
        setReservationRequest((prev) => ({
            ...prev,
            customerRequest: {
                ...prev.customerRequest,
                [field]: value
            },
        }));
    };

    const searchCustomerHandler = async () => {
        if (!customerRequest.identityCard) {
            alert("Please enter an ID/Passport number to search.");
            return;
        }

        setIsSearching(true); // Bật hiệu ứng xoay cho nút Search
        try {
            const customerResponse = await customerApi.getCustomerByIdentityCard(customerRequest.identityCard);
            if (customerResponse) {
                // Cập nhật nhiều trường cùng lúc vào area state
                setReservationRequest((prev) => ({
                    ...prev,
                    customerRequest: {
                        ...prev.customerRequest,
                        customerId: customerResponse.id,
                        fullName: customerResponse.fullName,
                        phoneNumber: customerResponse.phoneNumber,
                        email: customerResponse.email,
                    }
                }));
            } else {
                alert("Customer not found. Please check the ID/Passport number and try again.");
            }
        } catch (error) {
            console.error("Search customer error:", error);
        } finally {
            setIsSearching(false); // Tắt hiệu ứng
        }
    };

    return (
            <SectionCard title="3. Customer Information">
                <Grid gutter="md">
                    <Grid.Col span={{base: 12, sm: 7}}>
                        <Stack gap="sm">
                            <Group gap="xs" align="flex-end">
                                <TextInput
                                    label="Customer email"
                                    placeholder="Enter registered email..."
                                        value={customerRequest.identityCard}
                                        onChange={(e) => updateCustomerRequest("identityCard", e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && searchCustomerHandler()}
                                        style={{flex: 1}}
                                        radius="md"
                                        disabled={isSearching || isAreaLoading}
                                />
                                <Button
                                        variant="light"
                                        onClick={searchCustomerHandler}
                                        leftSection={<IconSearch size={16}/>}
                                        // Kết hợp cả 2 trạng thái loading
                                        loading={isSearching}
                                        disabled={isAreaLoading}
                                >
                                    Search
                                </Button>
                            </Group>

                            <TextInput
                                    label="Full Name"
                                    value={reservationRequest.customerRequest?.fullName ?? ""}
                                    radius="md"
                                    readOnly // Thường thông tin search được nên để read-only
                                    disabled={isSearching || isAreaLoading}
                            />

                            <Grid>
                                <Grid.Col span={6}>
                                    <TextInput
                                            label="Phone Number"
                                            value={reservationRequest.customerRequest?.phoneNumber ?? ""}
                                            onChange={(e) => updateCustomerRequest("phoneNumber", e.currentTarget.value)}
                                            placeholder="Enter phone number..."
                                            radius="md"
                                            disabled={isSearching || isAreaLoading}
                                    />
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <TextInput
                                            label="Email"
                                            value={reservationRequest.customerRequest?.email ?? ""}
                                            onChange={(e) => updateCustomerRequest("email", e.currentTarget.value)}
                                            placeholder="Enter email..."
                                            radius="md"
                                            disabled={isSearching || isAreaLoading}
                                    />
                                </Grid.Col>
                            </Grid>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 5}}>
                        <Textarea
                                label="Order Note"
                                placeholder="Special requests (room preference, transfer, etc.)"
                                value={reservationRequest.note}
                                onChange={(e) => updateReservationRequest("note", e.target.value)}
                                onBlur={(e) => setReservationRequest(prev => ({...prev, note: e.target.value}))}
                                minRows={7}
                                radius="md"
                                disabled={isSearching || isAreaLoading}
                        />
                    </Grid.Col>
                </Grid>
            </SectionCard>
    );
};
