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
import StatisticsView from '../features/ModerationCampaign/views/StatisticsView';
import Marketing from '../features/MarketingCampaign/main/Marketing';
import { MarketingProvider } from '../context/MarketingContext';
import CampaignsTable from '../pages/CampaignsTable';
import MarketingStatisticsView from '../features/MarketingCampaign/views/MarketingStatisticsView';
import { ListeningProvider } from '../context/ListeningContext';
import SocialListening from '../features/SocialListeningCampaign/Main/SocialListening';
import DatacivisLanding from '../WebLanding';
import { I18nProvider } from '../WebLanding/lib/i18n';
import Settings from '../pages/Settings';
import InstagramCallback from '../pages/InstagramCallback';
import FacebookCallback from '../pages/FacebookCallback';
import SubAuth from '../pages/SubAuth';
import Inbox from '../pages/Inbox';

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

            <Route
                path="/auth/sub"
                element={
                    <PublicOnlyRoute>
                        <SubAuth />
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

                <Route
                    path="/campaign_listening_creation/*"
                    element={
                        <ListeningProvider storageKey="campaign:listening:draft">
                            <Outlet />
                        </ListeningProvider>
                    } >
                    <Route index element={<SocialListening />} />

                </Route>

                <Route path="my_campaigns" element={<CampaignsTable />} />
                <Route path="my_marketing_campaign/:id/statistics" element={<MarketingStatisticsView />} />
                <Route path="my_moderation_campaign/:id/statistics" element={<StatisticsView />} />

                <Route path="/inbox" element={<Inbox />} />
                <Route path="/inbox/:agentId" element={<Inbox />} />

                <Route path="/settings" element={<Settings />} />
                {/* Billing oculto temporalmente en esta rama/release */}
            </Route>
            <Route path='/landing-datacivis' element={<I18nProvider>
                <DatacivisLanding />
            </I18nProvider>} />

            <Route path="/instagram/callback" element={<InstagramCallback />} />
            <Route path="/facebook/callback" element={<FacebookCallback />} />
            {/* (opcional) 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    </Router>
);

export default AppRouter;
