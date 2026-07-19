import {RECEPTIONIST_NAVBAR_ITEMS} from "../../constants/receptionist.jsx";
import {AppShell} from "@mantine/core";
import {useReceptionistLayout} from "../../hooks/receptionist/layout/use-receptionist-layout.jsx";
import {NavLink} from "react-router-dom";

export const ReceptionistNavbar = () => {
    const {isMobileOpen, toggle} = useReceptionistLayout();
    return (
            <AppShell.Navbar p="md">
                {RECEPTIONIST_NAVBAR_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                            <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => isMobileOpen && toggle()}
                                    className={({isActive}) => `
                            flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium mb-1 transition-colors
                            ${
                                            isActive
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    }
                        `}
                            >
                                <Icon size={20}/>
                                {item.label}
                            </NavLink>
                    )
                })}
            </AppShell.Navbar>
    )
}
