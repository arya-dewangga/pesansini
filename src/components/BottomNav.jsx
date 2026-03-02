import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
    { path: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
    { path: '/history', icon: 'history', label: 'History' },
    { path: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-center">
            <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-3xl">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'
                                }`}
                        >
                            <span className="material-icons-round text-2xl">{tab.icon}</span>
                            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
