import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';

const AppRouter: React.FC = () => (
    <Router>
        <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
        </Routes>
    </Router>
);

export default AppRouter;