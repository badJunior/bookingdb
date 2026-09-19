import Header from "./components/header";
import BikesList from "./components/bikesList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ModelsPage from "./pages/models/modelsPage";
import CategoriesPage from "./components/categoriesPage";
import AllBikesList from "./components/allBikesList";
import BookingPage from "./components/booking";
import LoginPage from "./components/loginPage";
import RegisterPage from "./components/registerPage";
import ProtectedRoute from "./components/protectedRoute";
import { RoleProvider } from "./components/roleContext";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <QueryClientProvider client={queryClient}>
          <Header />
          <Routes>
            {/* Публичные роуты */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Защищённые роуты */}
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

            {/* Редирект */}
            <Route
              path="/"
              element={<Navigate to="/booking/available-bikes" replace />}
            />
          </Routes>
        </QueryClientProvider>
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;
