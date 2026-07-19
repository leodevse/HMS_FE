// components/ReservationSearch.jsx
import {Button, Group, Select, TextInput} from "@mantine/core";
import {DateInput} from "@mantine/dates";
import {IconCalendar, IconSearch} from "@tabler/icons-react";
import {useObjectState} from "../../../hooks/common/use-object-state";
import {useReservationList} from "../../../hooks/common/list/reservation-list-provider.jsx";
import {STATUS_OPTIONS} from "../../../constants/reservation.jsx";

export const ReservationSearch = () => {
    // Phen nhớ giải nén 'isLoading' từ hook ra nhé
    const {searchParams, setSearchParams, isLoading} = useReservationList();

    const {updateField, data: localSearchParams} = useObjectState(
            /**
             * @type {ReservationSearchParams}
             */
            (searchParams)
    );

    const searchHandler = () => {
        updateField("page", 0);
        setSearchParams(localSearchParams);
    };

    return (
            <Group gap="sm" mb="md" wrap="wrap" align="flex-end">
                <TextInput
                        label="Guest Name"
                        placeholder="Customer name..."
                        leftSection={<IconSearch size={15}/>}
                        value={localSearchParams.guestName || ""}
                        onChange={(e) => updateField("guestName", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchHandler()}
                        radius="md"
                        size="sm"
                        style={{flex: 1, minWidth: 200}}
                />

                <TextInput
                        label="Identity Card"
                        placeholder="Identity Card..."
                        leftSection={<IconSearch size={15}/>}
                        value={localSearchParams.identityCard || ""}
                        onChange={(e) => updateField("identityCard", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchHandler()}
                        radius="md"
                        size="sm"
                        style={{flex: 1, minWidth: 180}}
                />

                <Select
                        label="Status"
                        placeholder="Status"
                        data={STATUS_OPTIONS}
                        value={localSearchParams.status || null}
                        onChange={(val) => updateField("status", val)}
                        clearable
                        radius="md"
                        size="sm"
                        style={{width: 150}}
                />

                <DateInput
                        label="From"
                        placeholder="Check-in from"
                        value={localSearchParams.checkInDateFrom ? new Date(localSearchParams.checkInDateFrom) : null}
                        onChange={(val) => updateField("checkInDateFrom", val?.toISOString())}
                        leftSection={<IconCalendar size={15}/>}
                        clearable
                        radius="md"
                        size="sm"
                        valueFormat="DD/MM/YYYY"
                        style={{width: 140}}
                />

                <DateInput
                        label="To"
                        placeholder="To date"
                        value={localSearchParams.checkInDateTo ? new Date(localSearchParams.checkInDateTo) : null}
                        onChange={(val) => updateField("checkInDateTo", val?.toISOString())}
                        leftSection={<IconCalendar size={15}/>}
                        clearable
                        radius="md"
                        size="sm"
                        valueFormat="DD/MM/YYYY"
                        style={{width: 140}}
                />

                <Button
                        leftSection={<IconSearch size={15}/>}
                        color="teal"
                        radius="md"
                        size="sm"
                        onClick={searchHandler}
                        // Dùng isLoading từ hook, nó sẽ tự hiện loader mặc định của Mantine
                        loading={isLoading}
                >
                    Search
                </Button>
            </Group>
    );
};