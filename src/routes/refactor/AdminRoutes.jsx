import {Route} from "react-router-dom";
import {ProtectedRoute} from "../ProtectedRoute.jsx";
import {AdminLayout} from "../../layouts/admin/AdminLayout.jsx";
import AdminDashboardPage from "../../pages/admin/DashboardPage.jsx";
import RoomManagementPage from "../../pages/admin/RoomManagementPage.jsx";
import RoomTypesPage from "../../pages/admin/RoomTypesPage.jsx";
import ServiceManagementPage from "../../pages/admin/ServiceManagementPage.jsx";
import StaffManagementPage from "../../pages/admin/StaffManagementPage.jsx";
import UserManagementPage from "../../pages/admin/UserManagementPage.jsx"
import ScheduleManagementPage from "../../pages/admin/ScheduleManagementPage.jsx";
import TaskManagementPage from "../../pages/admin/TaskManagementPage.jsx";
import PaymentManagementPage from "../../pages/admin/PaymentManagementPage.jsx";
import ReservationManagementPage from "../../pages/admin/ReservationManagementPage.jsx";

export const AdminRoutes = (
    <Route
        path="/admin"
        element={
            <ProtectedRoute>
                <AdminLayout/>
            </ProtectedRoute>
        }
    >
        <Route index element={<AdminDashboardPage/>}/>
        <Route path="rooms" element={<RoomManagementPage/>}/>
        <Route path="rooms/types" element={<RoomTypesPage/>}/>
        <Route path="rooms/service" element={<ServiceManagementPage/>}/>
        <Route path="customers" element={<UserManagementPage />}/>
        <Route path="reservations" element={<ReservationManagementPage/>}/>
        <Route path="staff" element={<StaffManagementPage />}/>
        <Route path="schedules" element={<ScheduleManagementPage />}/>
        <Route path="tasks" element={<TaskManagementPage />}/>
        <Route path="payments" element={<PaymentManagementPage /> }/>
        <Route path="reports" element={<div>Reports Management</div>}/>
        <Route path="settings" element={<div>Settings</div>}/>
    </Route>
);
