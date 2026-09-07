import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Gifts from './pages/Gifts';
import GiftBuilder from './pages/GiftBuilder';
import PublicGift from './pages/PublicGift';
import Landing from './pages/Landing';
import MainLayout from './layouts/MainLayout';
import { Toaster } from "@/components/ui/sonner"; // Assuming sonner is available or will create

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Public Gift Route */}
        <Route path="/p/:slug" element={<PublicGift />} />
        
        {/* Landing Page Route */}
        <Route path="/landing" element={<Landing />} />

        {/* Private Routes wrapped in MainLayout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/gifts"
          element={
            <PrivateRoute>
              <Gifts />
            </PrivateRoute>
          }
        />
        <Route
          path="/gifts/new"
          element={
            <PrivateRoute>
              <GiftBuilder />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
