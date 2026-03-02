import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import pkg from '../../package.json';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    let from = location.state?.from?.pathname || '/dashboard';
    if (from === '/profile') {
        from = '/dashboard';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Basic validation
        if (!fullName || !phoneNumber || !password || !confirmPassword) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        if (password.length < 8) {
            toast.error('Password minimal 8 karakter');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Password tidak sama');
            return;
        }

        try {
            setLoading(true);
            await register(phoneNumber, password, fullName);
            toast.success('Registrasi berhasil!');
            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Nomor HP sudah terdaftar');
            } else {
                toast.error('Gagal mendaftar. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-background-light font-display text-slate-800 min-h-screen flex flex-col items-center justify-center">
            {/* Background Decoration Image */}
            <div className="fixed top-0 left-0 w-full h-full opacity-5 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-[100px]"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary rounded-full blur-[100px]"></div>
            </div>

            <main className="w-full max-w-[400px] bg-white shadow-primary/10 rounded-xl overflow-hidden relative">
                {/* Decorative Top Pattern */}
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/20 to-transparent -z-10"></div>

                <div className="p-8">
                    {/* Header Section */}
                    <header className="mb-10 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-icons-round text-primary text-4xl">restaurant</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Registrasi Baru</h1>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Koordinasi pesanan jadi lebih mudah dan teratur bersama rekan Anda.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 ml-4 uppercase tracking-wider">
                                Nama Lengkap
                            </label>
                            <div className="relative group">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">person</span>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-full ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 ml-4 uppercase tracking-wider">
                                Nomor HP/WhatsApp
                            </label>
                            <div className="relative group">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">phone_iphone</span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="0812 3456 7890"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-full ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 ml-4 uppercase tracking-wider">
                                Kata Sandi
                            </label>
                            <div className="relative group">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-full ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                >
                                    <span className="material-icons-round text-[20px]">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 ml-4 uppercase tracking-wider">
                                Konfirmasi Kata Sandi
                            </label>
                            <div className="relative group">
                                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-[20px]">verified_user</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-full ring-1 ring-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Role Info */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-lg">
                            <span className="material-icons-round text-primary text-[18px]">info</span>
                            <p className="text-[11px] text-slate-600 leading-tight">
                                Registrasi ini berlaku untuk akses sebagai Host (Penyelenggara) maupun Peserta.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <span>{loading ? 'Mendaftar...' : 'Daftar Sekarang'}</span>
                            {!loading && <span className="material-icons-round">arrow_forward</span>}
                        </button>
                    </form>

                    {/* Footer Navigation */}
                    <footer className="mt-10 pb-4 text-center">
                        <p className="text-sm text-slate-500 mb-6">
                            Sudah punya akun? <Link to="/login" state={{ from: location.state?.from }} className="text-primary font-bold hover:underline decoration-2 underline-offset-4">Masuk</Link>
                        </p>
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-400">
                                v{pkg.version}
                            </p>
                            <p className="text-xs text-gray-400">
                                Dibuat dengan ❤️ by Putary
                            </p>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
