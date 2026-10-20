import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import MarketsPage from '../pages/MarketsPage';
import HarvestPage from '../pages/HarvestPage';
import TransportPage from '../pages/TransportPage';
import WeatherPage from '../pages/WeatherPage';
import ChatPage from '../pages/ChatPage';
import ProfilePage from '../pages/ProfilePage';
import SchemesPage from '../pages/SchemesPage';
import AdminPage from '../pages/AdminPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing & Preview Views (Accessible without login to view UI) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulator" element={<HarvestPage />} />
        <Route path="/harvest-preview" element={<HarvestPage />} />
        <Route path="/prices" element={<MarketsPage />} />
        <Route path="/assistant" element={<ChatPage />} />
        <Route path="/schemes-preview" element={<SchemesPage isPreview={true} />} />
      </Route>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Internal Application & Dashboard Routes (Protected at layout root) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/prices" element={<MarketsPage />} />
        <Route path="/harvest" element={<HarvestPage />} />
        <Route path="/simulator" element={<HarvestPage />} />
        <Route path="/transport" element={<TransportPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/assistant" element={<ChatPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/farmer/schemes" element={<SchemesPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all 404 Not Found */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
