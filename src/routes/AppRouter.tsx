import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dasboard';
import CampaignCreation from '../pages/CampaignCreation';
import Auth from '../pages/Auth';
import PublicOnlyRoute from './PublicOnlyRoute';
import ProtectedRoute from './ProtectedRoute';
import NotFound from '../components/features/NotFound';
import { ToastContainer } from 'react-toastify';

const AppRouter: React.FC = () => (
    <Router>
        <ToastContainer />
        <Routes>
            {/* Rutas públicas (solo si NO estás autenticado) */}
            <Route
                path="/auth"
                element={
                    <PublicOnlyRoute>
                        <Auth />
                    </PublicOnlyRoute>
                }
            />

            {/* Rutas privadas */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/campaign_selection" element={<CampaignCreation />} />
            </Route>

            {/* (opcional) 404 */}
            <Route path="*" element={<NotFound />}/>
        </Routes>
    </Router>
);

export default AppRouter;