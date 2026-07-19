import {ReceptionistLayoutContext} from "./receptionist-layout-context.jsx";
import {useDisclosure} from "@mantine/hooks";

export const ReceptionistLayoutProvider = ({children}) => {
    const [isMobileOpen, {toggle, close, open}] = useDisclosure(false);

    /**
     * @type {StaffLayoutContextType}
     */
    const value = {
        isMobileOpen,
        toggle,
        close,
        open
    }

    return (
            <ReceptionistLayoutContext.Provider value={value}>
                {children}
            </ReceptionistLayoutContext.Provider>
    )
}
