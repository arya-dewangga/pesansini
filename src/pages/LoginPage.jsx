import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import pkg from '../../package.json';

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    let from = location.state?.from?.pathname || '/dashboard';
    if (from === '/profile') {
        from = '/dashboard';
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Basic validation
        if (!phoneNumber || !password) {
            toast.error('Mohon lengkapi semua data');
            return;
        }

        try {
            setLoading(true);
            await login(phoneNumber, password);
            toast.success('Login berhasil!');
            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            toast.error('Gagal login. Periksa kembali nomor HP dan password Anda.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-background-light min-h-screen flex items-center justify-center relative overflow-hidden font-display antialiased text-gray-800">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-batik-pattern pointer-events-none z-0"></div>
            {/* <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-ramadan-green dark:bg-ramadan-green-dark blur-3xl opacity-60 z-0"></div> */}
            {/* <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-60 z-0"></div> */}

            <main className="w-full max-w-md h-full min-h-screen sm:min-h-0 sm:h-auto sm:rounded-xl relative z-10 flex flex-col justify-between p-6 sm:p-8 sm:bg-white/80 sm:backdrop-blur-xl  sm:border sm:border-white/20">
                <div className="flex-1 flex flex-col justify-center items-center text-center sm:mt-0 space-y-6">
                    {/* Logo Section */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative w-32 h-32 bg-gradient-to-br from-white to-ramadan-green rounded-full shadow-lg flex items-center justify-center border-4 border-white">
                            <img src="/pesansini-icon.svg" alt="Logo PesanSini" className="w-24 h-24 object-contain drop-shadow-sm" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg w-10 h-10">
                            <span className="material-icons-round text-xl">restaurant_menu</span>
                        </div>
                    </div>

                    <div className="space-y-2 max-w-xs mx-auto">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Mulai <span className="text-primary">Catat Pesanan</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed">
                            Masuk dan atur pesanan grup dengan mudah.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-6 mt-6 mb-4">
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 ml-4">
                            Nomor WhatsApp / HP
                        </label>
                        <div className="relative flex items-center group">
                            <div className="absolute left-4 top-0 bottom-0 flex items-center text-gray-400 pointer-events-none">
                                <span className="material-icons-round text-xl">phone_iphone</span>
                            </div>
                            <input
                                id="phone"
                                type="tel"
                                inputMode="numeric"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="0812-3456-7890"
                                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-full text-lg font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-4 mr-2">
                            <label htmlFor="password" class="block text-sm font-semibold text-gray-700">
                                Kata Sandi
                            </label>
                        </div>
                        <div className="relative flex items-center group">
                            <div className="absolute left-4 top-0 bottom-0 flex items-center text-gray-400 pointer-events-none">
                                <span className="material-icons-round">lock</span>
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan kata sandi"
                                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 rounded-full text-lg font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 text-gray-400 hover:text-primary transition-colors focus:outline-none p-1 rounded-full hover:bg-gray-100"
                            >
                                <span className="material-icons-round text-xl">
                                    {showPassword ? 'visibility' : 'visibility_off'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-primary hover:bg-primary-dark active:scale-[0.98] text-white rounded-full shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 transition-all duration-300 group mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span className="text-lg font-bold tracking-wide">
                            {loading ? 'Memproses...' : 'Masuk'}
                        </span>
                        {!loading && <span className="material-icons-round group-hover:translate-x-1 transition-transform">login</span>}
                    </button>
                </form>

                <div className="mt-auto text-center space-y-4 pb-4">
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mb-10">
                        Belum punya akun? <Link to="/register" state={{ from: location.state?.from }} className="text-primary hover:underline font-semibold">Daftar Sekarang</Link>
                    </p>
                    <div className="pt-2 border-t border-gray-100 w-2/3 mx-auto">
                        <a
                            href="https://wa.me/628988804460"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                            <span className="material-icons-round text-base">help_outline</span>
                            Butuh Bantuan?
                        </a>
                    </div>
                    <div className="mt-8 mb-6 text-center">
                        <p className="text-xs text-gray-400">
                            v{pkg.version}
                        </p>
                        <p className="text-xs text-gray-400">
                            Dibuat dengan ❤️ by Putary
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
