import React from 'react';
import type { ReactNode } from 'react';
import { Flag, Info } from 'lucide-react';

interface OfflineLayoutProps {
    children: ReactNode;
}

const OfflineLayout: React.FC<OfflineLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen grid place-content-center w-full">
            <nav
                className="h-[5vh] flex items-center justify-end w-full px-4"
                style={{ position: 'absolute', top: 0, right: 0, left: 0 }}
            >
                <button className="mx-2 text-2xl" aria-label="Language">
                    <Flag className="w-6 h-6" />
                </button>
                <button className="mx-2 text-2xl" aria-label="Info">
                    <Info className="w-6 h-6" />
                </button>
            </nav>
            <main className="">
                {children}
            </main>
        </div>
    );
};

export default OfflineLayout;
