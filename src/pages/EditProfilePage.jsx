import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserPhoneAndName } from '../services/authService';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
    const { userData } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(userData?.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if phone number is changed
    const isPhoneChanged = phoneNumber !== userData?.phoneNumber;

    async function handleSubmit(e) {
        e.preventDefault();

        // Basic validation
        if (!displayName || !phoneNumber) {
            toast.error('Mohon lengkapi data');
            return;
        }

        if (isPhoneChanged && !currentPassword) {
            toast.error('Masukkan password untuk mengubah nomor HP');
            return;
        }

        // Sanitize phone input just in case
        const sanitizedPhone = phoneNumber.startsWith('0') ? phoneNumber.slice(1) : phoneNumber;

        try {
            setLoading(true);
            await updateUserPhoneAndName(displayName, sanitizedPhone, currentPassword);
            toast.success('Profil berhasil diperbarui!');
            navigate('/profile');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Nomor HP sudah digunakan oleh pengguna lain');
            } else if (error.code === 'auth/wrong-password') {
                toast.error('Password salah');
            } else {
                toast.error('Gagal memperbarui profil: ' + error.message);
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
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">Edit Profil</h1>
                </header>

                <main className="flex-1 px-6 py-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar (Static for now) */}
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-primary/20">
                                {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <button type="button" className="text-primary text-sm font-semibold hover:underline" onClick={() => toast('Upload foto belum tersedia')}>
                                Ubah Foto
                            </button>
                        </div>

                        {/* Name Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                placeholder="Nama Lengkap"
                            />
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                Nomor HP (WhatsApp)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold" style={{ display: phoneNumber.startsWith('0') ? 'none' : 'none' }}>
                                    {/* Placeholder for prefix if we enforced +62, but we use raw input now */}
                                </span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Contoh: 08123456789"
                                />
                            </div>
                            <p className="text-xs text-gray-500 ml-1">
                                Ubah nomor HP akan mengubah nomor login Anda.
                            </p>
                        </div>

                        {/* Password Field (Conditional) */}
                        {isPhoneChanged && (
                            <div className="space-y-1.5 animate-fadeIn">
                                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1">
                                    <span className="material-icons-round text-sm text-primary">lock</span>
                                    Konfirmasi Password
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="Masukkan password saat ini"
                                />
                                <p className="text-xs text-orange-500 ml-1">
                                    Diperlukan untuk verifikasi keamanan saat mengganti nomor HP.
                                </p>
                            </div>
                        )}

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
