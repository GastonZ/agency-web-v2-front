import React, { useState } from 'react';
import OfflineLayout from '../layout/OfflineLayout';
import Login from './Login';
import SignUp from './SignUp';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    const { t } = useTranslation('translations');

    return (
        <OfflineLayout>
            {isLogin ? <Login /> : <SignUp setIsLogin={setIsLogin} />}
            <button
                className='flex justify-center items-center w-full mt-4 p-2 bg-black dark:bg-gray-100 rounded-md cursor-pointer hover:scale-105 transition-transform'
                onClick={() => setIsLogin((prev) => !prev)}
            >
                <p className='text-center w-full text-sm text-gray-200 dark:text-black'>
                    {isLogin ? t("auth_no_account") : t("auth_have_account")}
                </p>
            </button>
            <Link
                to="/auth/sub"
                className="flex justify-center items-center w-full mt-2 p-2 bg-white/70 dark:bg-neutral-900/50 rounded-md cursor-pointer hover:scale-105 transition-transform border border-black/10 dark:border-white/10"
            >
                <p className="text-center w-full text-sm text-neutral-800 dark:text-neutral-200">
                    {t("auth_subaccount", { defaultValue: "Tengo una cuenta de miembro" })}
                </p>
            </Link>
        </OfflineLayout>
    );
};

export default Auth;