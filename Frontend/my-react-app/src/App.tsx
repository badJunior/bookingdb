import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/appLayout";
import ProtectedRoute from "./components/protectedRoute";
import { RoleProvider } from "./components/roleContext";
import LoginPage from "./components/loginPage";
import RegisterPage from "./components/registerPage";
import RegisterCourierPage from "./components/registerCourierPage";
import ModelsPage from "./pages/models/modelsPage";
import CategoriesPage from "./components/categoriesPage";
import AllBikesList from "./components/allBikesList";
import BikesList from "./components/bikesList";
import BookingPage from "./components/booking";
import MyBookingsPage from "./myBookingsPage";
import MyDeliveriesPage from "./myDeliveriesPage";
import CourierPage from "./courierPage";
import AdminDeliveriesPage from "./adminDeliveriesPage";
import AdminRentalsPage from "./adminRentalsPage";
import PaymentPage from "./paymentPage";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/courier" element={<RegisterCourierPage />} />

            <Route element={<AppLayout />}>
              <Route
                path="/models"
                element={
                  <ProtectedRoute>
                    <ModelsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bikes"
                element={
                  <ProtectedRoute>
                    <AllBikesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/available-bikes"
                element={
                  <ProtectedRoute>
                    <BikesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/bookings"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-deliveries"
                element={
                  <ProtectedRoute>
                    <MyDeliveriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courier"
                element={
                  <ProtectedRoute allowedRoles={["Courier"]}>
                    <CourierPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/deliveries"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <AdminDeliveriesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rentals"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <AdminRentalsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Старый маршрут IDE убран, оставлен редирект. */}
            <Route path="/ide" element={<Navigate to="/" replace />} />

            <Route path="/" element={<Navigate to="/booking/available-bikes" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </QueryClientProvider>
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;
