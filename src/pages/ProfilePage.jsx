import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import toast from 'react-hot-toast';
import pkg from '../../package.json';

export default function ProfilePage() {
    const { userData, logout } = useAuth();
    const navigate = useNavigate();

    const firstName = userData?.displayName?.split(' ')[0] || 'User';
    const initials = (userData?.displayName || 'U')
        .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
            toast.success('Berhasil logout');
        } catch {
            toast.error('Gagal logout');
        }
    }

    const menuItems = [
        {
            icon: 'person',
            label: 'Edit Profil',
            subtitle: 'Ubah nama & foto profil',
            color: 'bg-blue-100 text-blue-600',
            onClick: () => navigate('/profile/edit'),
        },
        {
            icon: 'shield',
            label: 'Keamanan Akun',
            subtitle: 'Password & autentikasi',
            color: 'bg-green-100 text-green-600',
            onClick: () => navigate('/profile/security'),
        },
        {
            icon: 'help',
            label: 'Bantuan',
            subtitle: 'Hubungi kami',
            color: 'bg-purple-100 text-purple-600',
            onClick: () => window.open('https://wa.me/628988804460', '_blank'),
        },
        {
            icon: 'volunteer_activism',
            label: 'Dukungan Developer',
            subtitle: 'Traktir kopi untuk developer ☕',
            color: 'bg-pink-100 text-pink-600',
            onClick: () => navigate('/donation'),
        },
    ];

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative pb-28">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm px-6 pt-4 pb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900">Profil</h1>
                </header>

                {/* Profile Card */}
                <div className="px-6 mb-8">
                    <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                {initials}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900">{userData?.displayName || 'User'}</h2>
                                <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                                    <span className="material-icons-round text-sm">phone</span>
                                    {userData?.phoneNumber || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="px-6 mb-6">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-card border border-gray-100">
                        {menuItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={item.onClick}
                                className={`w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${i < menuItems.length - 1 ? 'border-b border-gray-50' : ''
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                                    <span className="material-icons-round text-xl">{item.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{item.label}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
                                </div>
                                <span className="material-icons-round text-gray-300">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <div className="px-6">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 border border-red-100 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all"
                    >
                        <span className="material-icons-round">logout</span>
                        Keluar
                    </button>
                </div>
                <div className="mt-8 mb-6 text-center">
                    <p className="text-xs text-gray-400">
                        v{pkg.version}
                    </p>
                    <p className="text-xs text-gray-400">
                        Dibuat dengan ❤️ by Putary
                    </p>
                </div>
                <BottomNav />
            </div>

        </div>
    );
}
