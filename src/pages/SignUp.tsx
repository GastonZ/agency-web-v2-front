import React, { useState } from 'react';

const SignUp: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setError('');
        alert(`Logged in as: ${email}`);
    };

    return (
        <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
            <h1>SignUp</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                </div>
                {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
                <button type="submit" style={{ width: '100%' }}>SignUp</button>
            </form>
        </div>
    );
};

export default SignUp;