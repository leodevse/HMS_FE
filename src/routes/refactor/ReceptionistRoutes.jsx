import {Route} from "react-router-dom";
import {ProtectedRoute} from "../ProtectedRoute";
import RecepDashboardPage from "../../pages/receptionist/Dashboard.jsx";

export const ReceptionistRoutes = (
    <Route
        path="/receptionist"
        element={
            <ProtectedRoute>
                <RecepDashboardPage/>
            </ProtectedRoute>
        }
    />
);
