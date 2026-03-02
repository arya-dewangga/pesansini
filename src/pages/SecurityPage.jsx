import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/authService';
import toast from 'react-hot-toast';

export default function SecurityPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Password baru tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        try {
            setLoading(true);
            await changePassword(currentPassword, newPassword);
            toast.success('Password berhasil diubah!');
            navigate('/profile');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                toast.error('Password saat ini salah');
            } else {
                toast.error('Gagal mengubah password: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative flex flex-col">
                {/* Header */}
                <header className="px-6 pt-4 pb-2 flex items-center gap-4 sticky top-0 bg-background-light/95 backdrop-blur-sm z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-icons-round text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">Keamanan Akun</h1>
                </header>

                <main className="flex-1 px-6 py-8">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3 mb-8">
                        <span className="material-icons-round text-orange-500 mt-0.5">security</span>
                        <div>
                            <h3 className="text-sm font-bold text-orange-800">Ubah Password</h3>
                            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                Pastikan passwordmu kuat dan unik untuk menjaga keamanan akun. Jangan bagikan password kepada siapapun.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Current Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Password Saat Ini
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                placeholder="Minimal 6 karakter"
                                required
                            />
                        </div>

                        {/* Confirm New Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Ulangi Password Baru
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Menyimpan...' : 'Perbarui Password'}
                                {!loading && <span className="material-icons-round text-sm">lock_reset</span>}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
