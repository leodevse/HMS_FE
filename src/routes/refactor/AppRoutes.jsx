import {BrowserRouter, Routes} from "react-router-dom";
import { AuthenticationRoutes } from "./AuthenticationRoutes.jsx";
import { CustomerRoutes } from "./CustomerRoutes.jsx";
import { AdminRoutes } from "./AdminRoutes.jsx";
import { HousekeepingRoutes } from "./HousekeepingRoutes.jsx";
import { ReceptionistRoutes } from "./ReceptionistRoutes.jsx";
import { StaffRoutes } from "./StaffRoutes.jsx";
import { ErrorRoutes } from "./ErrorRoutes.jsx";

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {AuthenticationRoutes}
                {CustomerRoutes}
                {AdminRoutes}
                {HousekeepingRoutes}
                {ReceptionistRoutes}
                {StaffRoutes}
                {ErrorRoutes}
            </Routes>
        </BrowserRouter>
    );
};
