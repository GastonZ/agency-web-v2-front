import React, { useState } from 'react';
import OfflineLayout from '../layout/OfflineLayout';
import Login from './Login';
import SignUp from './SignUp';
import { useTranslation } from 'react-i18next';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    const { t } = useTranslation('translations');

    return (
        <OfflineLayout>
            {isLogin ? <Login /> : <SignUp setIsLogin={setIsLogin} />}
            <button 
            className='flex justify-center items-center w-full mt-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer'
                onClick={() => setIsLogin((prev) => !prev)}
            >
                <p className='text-center w-full text-sm text-gray-500'>
                    {isLogin ? t("auth_no_account") : t("auth_have_account")}
                </p>
            </button>
        </OfflineLayout>
    );
};

export default Auth;