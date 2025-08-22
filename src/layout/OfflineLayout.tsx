import React from 'react';
import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import LenguageBtn from '../components/features/LenguageBtn';
import ThemeToggle from '../components/features/ThemeToggle';

interface OfflineLayoutProps {
    children: ReactNode;
}

const OfflineLayout: React.FC<OfflineLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen grid place-content-center w-full bg-gray-100 dark:bg-gray-950">
            <nav
                className="h-[5vh] flex items-center justify-end w-full px-4 pr-7 pt-4"
                style={{ position: 'absolute', top: 0, right: 0, left: 0 }}
            >
                <LenguageBtn />
                <button className="mx-2 text-2xl" aria-label="Info">
                    <Info className="w-6 h-6 text-black dark:text-white" />
                </button>
                <ThemeToggle />
            </nav>
            <main className="">
                {children}
            </main>
        </div>
    );
};

export default OfflineLayout;
