import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Dashboard from '../pages/Dasboard';
import CampaignCreation from '../pages/CampaignCreation';
import Auth from '../pages/Auth';
import PublicOnlyRoute from './PublicOnlyRoute';
import ProtectedRoute from './ProtectedRoute';
import NotFound from '../components/features/NotFound';
import { ToastContainer } from 'react-toastify';

import { ModerationProvider } from '../context/ModerationContext';
import Moderation from '../features/ModerationCampaign/Main/Moderation';
import MyModerationCampaigns from '../features/ModerationCampaign/views/MyModerationCampaigns';
import StatisticsView from '../features/ModerationCampaign/views/StatisticsView';
import Marketing from '../features/MarketingCampaign/main/Marketing';
import { MarketingProvider } from '../context/MarketingContext';
import CampaignsTable from '../pages/CampaignsTable';

const AppRouter: React.FC = () => (
    <Router>
        <ToastContainer />
        <Routes>
            {/* Rutas públicas*/}
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

                <Route
                    path="/campaign_moderation_creation/*"
                    element={
                        <ModerationProvider storageKey="campaign:moderation:draft">
                            <Outlet />
                        </ModerationProvider>
                    }
                >
                    <Route index element={<Moderation />} />
                </Route>

                <Route 
                    path="/campaign_marketing_creation/*"
                    element={
                        <MarketingProvider storageKey="campaign:marketing:draft">
                            <Outlet />
                        </MarketingProvider>
                    } >
                    <Route index element={<Marketing />} />    
                </Route>

                <Route path="my_campaigns" element={<CampaignsTable />} />
                <Route path="my_moderation_campaign/:id/statistics" element={<StatisticsView />} />

            </Route>

            {/* (opcional) 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    </Router>
);

export default AppRouter;