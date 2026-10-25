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

// FPO Module Pages
import FpoDashboardPage from '../pages/fpo/FpoDashboardPage';
import FpoMembersPage from '../pages/fpo/FpoMembersPage';
import FpoCropAvailabilityPage from '../pages/fpo/FpoCropAvailabilityPage';
import FpoAggregationPage from '../pages/fpo/FpoAggregationPage';
import FpoProcurementPage from '../pages/fpo/FpoProcurementPage';
import FpoTransportPage from '../pages/fpo/FpoTransportPage';
import FpoOrdersPage from '../pages/fpo/FpoOrdersPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing & Marketing View */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/schemes-preview" element={<SchemesPage isPreview={true} />} />
        <Route path="/harvest-preview" element={<HarvestPage isPreview={true} />} />
      </Route>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      {/* Application & Feature Workspace Routes */}
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
        
        {/* FPO Module Routes */}
        <Route
          path="/fpo"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/dashboard"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/members"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoMembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/crops"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoCropAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/aggregation"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoAggregationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/procurement"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoProcurementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/transport"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoTransportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fpo/orders"
          element={
            <ProtectedRoute requiredRole="fpo">
              <FpoOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRole="auth" requireAuth={true}>
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
