import { Route } from "react-router-dom";
import { CustomerLayout } from "../../layouts/customer/CustomerLayout.jsx";
import HomePage from "../../pages/customer/HomePage.jsx";
import { ProtectedRoute } from "../ProtectedRoute.jsx";
import RoomsPage from "../../pages/customer/RoomsPage.jsx";
import BookingHistoryPage from "../../pages/customer/BookingHistoryPage.jsx";

function BookingDetailPage() {
    return null;
}

export const CustomerRoutes = (
    <>
        <Route path="/" element={<CustomerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="rooms" element={<RoomsPage />} />
        </Route>

        <Route
            path="/customer"
            element={
                <ProtectedRoute>
                    <CustomerLayout />
                </ProtectedRoute>
            }
        >
            <Route path="bookings" element={<BookingHistoryPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
        </Route>
    </>
);
