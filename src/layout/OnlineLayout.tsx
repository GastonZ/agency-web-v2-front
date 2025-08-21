import React from 'react';
import type { ReactNode } from 'react';
import LenguageBtn from '../components/ui/features/LenguageBtn';
import LogoutBtn from '../components/ui/features/LogoutBtn';

interface OnlineLayoutProps {
    children: ReactNode;
}

const OnlineLayout: React.FC<OnlineLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen grid place-content-center w-full">
            <nav
                className="h-[5vh] flex items-center justify-end w-full px-4 pr-7 pt-4"
                style={{ position: 'absolute', top: 0, right: 0, left: 0 }}
            >
                <LenguageBtn />
                <LogoutBtn />
            </nav>
            <main className="">
                {children}
            </main>
        </div>
    );
};

export default OnlineLayout;
