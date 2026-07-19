import {Route} from "react-router-dom";
import {HousekeepingLayout} from "../../layouts/housekeeping/HousekeepingLayout";
import {ProtectedRoute} from "../ProtectedRoute";
import MobileTasksPage from "../../pages/housekeeping/MobileTasksPage.jsx";

export const HousekeepingRoutes = (
    <Route
        path="/housekeeping"
        element={
            <ProtectedRoute>
                <HousekeepingLayout/>
            </ProtectedRoute>
        }
    >
        <Route index element={<MobileTasksPage/>}/>
        <Route path="tasks" element={<MobileTasksPage/>}/>
    </Route>
);
