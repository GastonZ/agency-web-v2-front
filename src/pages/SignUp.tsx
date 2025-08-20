import React, { useState } from "react";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/ui/FormError";

const SignUp: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }
        setError("");
        alert(`Logged in as: ${email}`);
    };

    return (
        <div className="w-full max-w-sm mx-auto px-4">

            <h1 className="text-3xl font-semibold text-center tracking-tight">AgencIA</h1>

            <div className="mt-14 text-center">
                <h2 className="text-2xl font-semibold">Registrarse</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Ingresa tus datos para crear una cuenta
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <Input
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                />

                <PasswordInput
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                    autoComplete="new-password"
                />

                <FormError message={error} />

                <Button type="submit">SignUp</Button>
            </form>
        </div>
    );
};

export default SignUp;
