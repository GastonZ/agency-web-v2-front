import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dasboard';
import About from '../pages/About';
import Auth from '../pages/Auth';

const AppRouter: React.FC = () => (
    <Router>
        <Routes>
            <Route path='/auth' element={<Auth />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
        </Routes>
    </Router>
);

export default AppRouter;