import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Button from '../ui/button/Button';
import { useAuth } from '../../context/AuthContext';

export default function SignInForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email.trim(), password);

            const storedUser = localStorage.getItem('user');
            const user = storedUser ? (JSON.parse(storedUser) as { role?: string }) : null;
            if (user?.role !== 'ADMIN') {
                logout();
                setError('Administrator access only. Customers can shop without an account.');
                return;
            }

            navigate('/admin', { replace: true });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-md pt-10" />
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
                            Private administration
                        </p>
                        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
                            Administrator sign in
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This area is reserved for Irys Store administrators.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <Label>
                                    Email <span className="text-error-500">*</span>
                                </Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <Label>
                                    Password <span className="text-error-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                                        ) : (
                                            <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign in to administration'}
                            </Button>
                        </div>
                    </form>

                    <button
                        type="button"
                        onClick={() => navigate('/shop')}
                        className="mt-6 w-full text-center text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-300"
                    >
                        Return to the public shop
                    </button>
                </div>
            </div>
        </div>
    );
}
