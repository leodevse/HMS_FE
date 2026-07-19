import {useContext} from "react";
import {ReceptionistLayoutContext} from "./receptionist-layout-context.jsx";

export const useReceptionistLayout = () => {
    const context = useContext(ReceptionistLayoutContext);

    if (!context) {
        throw new Error("useStaffLayout must be used within a StaffLayoutProvider");
    }

    return context;
}
