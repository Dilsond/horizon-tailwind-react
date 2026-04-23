import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "layouts/admin";
import Auth from "layouts/auth"; // ou o caminho correto do seu Auth

const App = () => {
  const isAuthenticated = !!localStorage.getItem("admin");

  return (
    <Routes>
      <Route path="auth/*" element={<Auth />} />
      <Route 
        path="admin/*" 
        element={isAuthenticated ? <AdminLayout /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/admin/default" : "/auth"} replace />} 
      />
    </Routes>
  );
};

export default App;