import React, { useState } from 'react';
import OfflineLayout from '../layout/OfflineLayout';
import Login from './Login';
import SignUp from './SignUp';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <OfflineLayout>
            {isLogin ? <Login /> : <SignUp />}
            <button 
            className='flex justify-center items-center w-full mt-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer'
                onClick={() => setIsLogin((prev) => !prev)}
            >
                <p className='text-center w-full text-sm text-gray-500'>
                    {isLogin ? " ¿ No tienes cuenta ? Registrate" : " ¿ Ya tienes una cuenta ? Inicia sesión"}
                </p>
            </button>
        </OfflineLayout>
    );
};

export default Auth;