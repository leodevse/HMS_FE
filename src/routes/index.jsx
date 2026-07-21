import {createBrowserRouter, Navigate} from "react-router-dom";
import {CustomerLayout} from "../layouts/customer/CustomerLayout.jsx";
import {AdminLayout} from "../layouts/admin/AdminLayout.jsx";
import {HousekeepingLayout} from "../layouts/housekeeping/HousekeepingLayout.jsx";
import {ProtectedRoute} from "./ProtectedRoute.jsx";
import {AuthLayout} from "../layouts/AuthLayout.jsx";

// Import Pages
import HomePage from "../pages/customer/HomePage.jsx";
import RoomsPage from "../pages/customer/RoomsPage.jsx";
import RoomDetailPage from "../pages/customer/RoomDetailPage.jsx";
import ServicesPage from "../pages/customer/ServicesPage.jsx";
import BookingPage from "../pages/customer/BookingPage.jsx";
import CheckoutPage from "../pages/customer/CheckoutPage.jsx";
import ServiceCheckoutPage from "../pages/customer/ServiceCheckoutPage.jsx";
import BookingHistoryPage from "../pages/customer/BookingHistoryPage.jsx";
import PaymentCallbackPage from "../pages/customer/PaymentCallbackPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import OAuth2RedirectPage from "../pages/auth/OAuth2RedirectPage.jsx";
import AdminDashboardPage from "../pages/admin/DashboardPage.jsx";
import RoomManagementPage from "../pages/admin/RoomManagementPage.jsx";
import RoomTypesPage from "../pages/admin/RoomTypesPage.jsx";
import ServiceManagementPage from "../pages/admin/ServiceManagementPage.jsx";
import StaffManagementPage from "../pages/admin/StaffManagementPage.jsx";
import UserManagementPage from "../pages/admin/UserManagementPage.jsx";
import ScheduleManagementPage from "../pages/admin/ScheduleManagementPage.jsx";
import TaskManagementPage from "../pages/admin/TaskManagementPage.jsx";
import BookingDetailPage from "../pages/customer/BookingDetailPage.jsx";
import MyReviewsPage from "../pages/customer/MyReviewsPage.jsx";
import PaymentManagementPage from "../pages/admin/PaymentManagementPage.jsx";
import ReservationManagementPage from "../pages/admin/ReservationManagementPage.jsx";
import UnauthorizedPage from "../pages/error/UnauthorizedPage.jsx";
import NotFoundPage from "../pages/error/NotFoundPage.jsx";
import ReportsPage from "../pages/housekeeping/ReportsPage.jsx";
import SchedulePage from "../pages/housekeeping/SchedulePage.jsx";
import TaskDetailPage from "../pages/housekeeping/TaskDetailPage.jsx";
import TasksPage from "../pages/housekeeping/TasksPage.jsx";
import {ReceptionistLayout} from "../layouts/receptionist/ReceptionistLayout.jsx";
import {RECEPTIONIST_ROUTES} from "../constants/receptionist.jsx";
import {DashboardPage} from "../pages/housekeeping/DashboardPage.jsx";

// Import Housekeeping Pages (Nếu cần dùng thì uncomment children bên dưới)
// import DashboardPage from '../pages/housekeeping/DashboardPage.jsx';
// import TasksPage from '../pages/housekeeping/TasksPage.jsx';

export const router = createBrowserRouter([
    // ===== ROLE-SPECIFIC ROUTES (Ưu tiên cao nhất) =====
    {
        path: '/admin',
        element: (
                <ProtectedRoute requiredRole="ADMIN">
                    <AdminLayout/>
                </ProtectedRoute>
        ),
        children: [
            {index: true, element: <AdminDashboardPage/>},
            {path: "rooms", element: <RoomManagementPage/>},
            {path: "rooms/types", element: <RoomTypesPage/>},
            {path: "rooms/service", element: <ServiceManagementPage/>},
            {path: "staff", element: <StaffManagementPage/>},
            {path: "reservations", element: <ReservationManagementPage/>},
            {path: "customers", element: <UserManagementPage/>},
            {path: "schedules", element: <ScheduleManagementPage/>},
            {path: "tasks", element: <TaskManagementPage/>},
            {path: "housekeeping-tasks", element: <Navigate to="/admin/tasks" replace/>},
            {path: "payments", element: <PaymentManagementPage/>},
            {path: "reports", element: <div>Reports Management</div>},
            {path: "settings", element: <div>Settings</div>},
        ],
    },

    // 6. HOUSEKEEPING ROUTES
    {
        path: '/housekeeping',
        element: (
                <ProtectedRoute requiredRole="HOUSEKEEPING">
                    <HousekeepingLayout/>
                </ProtectedRoute>
        ),
        children: [
            {index: true, element: <DashboardPage/>},
            {path: 'dashboard', element: <DashboardPage/>},
            {path: 'tasks', element: <TasksPage/>},
            {path: 'tasks/:taskId', element: <TaskDetailPage/>},
            {path: 'schedule', element: <SchedulePage/>},
            {path: 'reports', element: <ReportsPage/>},
        ],
    },

    // RECEPTIONIST ROUTES
    {
        path: '/receptionist',
        element: (
                <ProtectedRoute requiredRole="RECEPTIONIST">
                    <ReceptionistLayout/>
                </ProtectedRoute>
        ),
        children: [
            {index: true, element: <Navigate to="reservations" replace/>},
            ...RECEPTIONIST_ROUTES.map((item) => {
                const relativePath = item.path
                        .replace(/^\//, "")
                        .replace(/^receptionist\//, "")
                        .replace(/^\//, "");
                return {
                    path: relativePath,
                    element: item.element,
                };
            }),
        ],
    },

    // ===== CUSTOMER ROUTES (Public & Protected) =====
    {
        path: '/user',
        element: <CustomerLayout/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: 'rooms', element: <RoomsPage/>},
            {path: 'rooms/:id', element: <RoomDetailPage/>},
            {path: 'services', element: <ServicesPage/>},
            {path: 'services/checkout', element: <ProtectedRoute><ServiceCheckoutPage/></ProtectedRoute>},
            {path: 'booking', element: <ProtectedRoute><BookingPage/></ProtectedRoute>},
            {path: 'booking/checkout', element: <ProtectedRoute><CheckoutPage/></ProtectedRoute>},
            {path: 'history', element: <ProtectedRoute><BookingHistoryPage/></ProtectedRoute>},
            {path: 'bookings/:bookingId', element: <ProtectedRoute><BookingDetailPage/></ProtectedRoute>},
            {path: 'reviews', element: <ProtectedRoute><MyReviewsPage/></ProtectedRoute>},
            {path: 'payment/vnpay-callback', element: <PaymentCallbackPage/>},
        ],
    },
    {
        path: '/',
        element: <Navigate to="/user" replace/>,
    },
    // ===== AUTH LAYOUT RIÊNG (nếu muốn layout khác cho auth) =====
    {
        path: '/',
        element: <AuthLayout/>,
        children: [
            {path: 'login', element: <LoginPage/>},
            {path: 'register', element: <RegisterPage/>},
            {path: 'forgot-password', element: <div>Forgot Password</div>},
        ],
    },

    // ===== SPECIAL ROUTES =====
    {
        path: '/oauth2/redirect',
        element: <OAuth2RedirectPage/>,
    },
    {
        path: '/unauthorized',
        element: <UnauthorizedPage/>,
    },
    {
        path: '/404',
        element: <NotFoundPage/>,
    },
    {
        path: '*',
        element: <NotFoundPage/>,
    },
]);
