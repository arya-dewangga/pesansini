import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomsByHost, onRoomsByHostSnapshot, getRoomsByIds, checkAndCloseExpiredRooms } from '../services/roomService';
import JoinRoomCard from '../components/JoinRoomCard';
import BottomNav from '../components/BottomNav';

export default function DashboardPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [rooms, setRooms] = useState([]);
    const [activeHostRooms, setActiveHostRooms] = useState([]);
    const [joinedRooms, setJoinedRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData?.uid) return;

        // 0. Auto-close expired rooms
        checkAndCloseExpiredRooms(userData.uid).catch(console.error);

        // 1. Host Listener
        const unsubscribe = onRoomsByHostSnapshot(
            userData.uid,
            (data) => {
                setRooms(data);
                setActiveHostRooms(data.filter(r => r.status === 'open'));
            },
            (error) => {
                console.error("FAILED TO LOAD ROOMS.", error);
            }
        );

        // 2. Fetch Joined Rooms
        async function fetchJoined() {
            if (userData?.joinedRooms && userData.joinedRooms.length > 0) {
                try {
                    const joined = await getRoomsByIds(userData.joinedRooms);
                    // Filter only open joined rooms for "Active Gatherings"
                    setJoinedRooms(joined.filter(r => r.status === 'open'));
                } catch (e) {
                    console.error("Error fetching joined rooms", e);
                }
            } else {
                setJoinedRooms([]);
            }
            setLoading(false);
        }
        fetchJoined();

        return () => unsubscribe();
    }, [userData]);

    // Merge and Deduplicate Active Rooms
    const allActiveRooms = [...activeHostRooms, ...joinedRooms].filter((room, index, self) =>
        index === self.findIndex((r) => (r.id === room.id))
    );

    // Sort by deadline (closest first) or createdAt (newest first)
    // If deadline exists, use it. Otherwise createdAt.
    allActiveRooms.sort((a, b) => {
        const getTime = (r) => {
            if (r.deadline) {
                // Handle Firestore Timestamp or ISO String
                return typeof r.deadline.toMillis === 'function' ? r.deadline.toMillis() : new Date(r.deadline).getTime();
            }
            // Handle createdAt
            return r.createdAt && typeof r.createdAt.toMillis === 'function' ? r.createdAt.toMillis() : 0;
        };

        const timeA = getTime(a);
        const timeB = getTime(b);
        return a.deadline ? (timeA - timeB) : (timeB - timeA);
    });

    // Helper functions
    function getTimeRemaining(timestamp) {
        if (!timestamp) return null;
        const end = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        const diff = end - new Date();

        if (diff <= 0) return { expired: true, text: 'Ended' };

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours < 1) return { minutes, text: `${minutes}m`, urgent: true };
        if (hours < 24) return { hours, text: `${hours}h`, urgent: false };
        const days = Math.floor(hours / 24);
        return { days, text: `${days}d`, urgent: false };
    }

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    }

    const firstName = userData?.displayName?.split(' ')[0] || 'User';

    // Calculate unique total rooms (hosted + joined, no duplicates)
    const hostedIds = new Set(rooms.map(r => r.id));
    const joinedIds = new Set(userData?.joinedRooms || []);
    const uniqueRoomIds = new Set([...hostedIds, ...joinedIds]);
    const totalRoomsCount = uniqueRoomIds.size;

    return (
        <div className="min-h-screen bg-background-light font-display text-gray-800 relative overflow-hidden flex flex-col items-center">
            {/* Mobile Container */}
            <div className="w-full max-w-md h-full min-h-screen bg-background-light  relative overflow-y-auto pb-24">
                {/* Header Section */}
                <header className="bg-background-light/95 backdrop-blur-sm sticky top-0 z-20 px-6 pt-4 pb-2 flex justify-between items-start animate-fade-in">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{getGreeting()},</p>
                        <h1 className="text-2xl font-bold text-gray-900 ">Halo, {firstName}!</h1>
                    </div>
                    <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 bg-gray-200">
                            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                                {firstName[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats Summary */}
                <section className="px-6 py-4 animate-fade-in delay-100">
                    <div className="bg-primary/10 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
                        {/* Decorative background shapes */}
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-extrabold text-primary">{allActiveRooms.length}</h2>
                            <p className="text-sm font-semibold text-gray-700">Active Rooms</p>
                        </div>
                        <div className="h-10 w-px bg-primary/20 mx-4"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-extrabold text-primary">{totalRoomsCount}</h2>
                            <p className="text-sm font-semibold text-gray-700">Total Rooms</p>
                        </div>
                    </div>
                </section>

                {/* Section Title */}
                <div className="px-6 mt-4 mb-2 flex justify-between items-end animate-fade-in delay-200">
                    <h3 className="text-lg font-bold text-gray-900">Your Active Gatherings</h3>
                    <button onClick={() => navigate('/history')} className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">View History</button>
                </div>

                {/* Room Cards List */}
                <main className="px-6 space-y-4 pb-20 animate-fade-in delay-300">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : allActiveRooms.length === 0 ? (
                        <div className="flex flex-col gap-6">
                            <div className="py-2 flex flex-col items-center justify-center text-center">
                                <div className="bg-gray-100 p-4 rounded-full mb-3">
                                    <span className="material-icons-round text-3xl text-gray-400">restaurant_menu</span>
                                </div>
                                <h4 className="text-base font-bold text-gray-900">Belum ada room aktif</h4>
                                <p className="text-gray-500 text-xs mt-1 max-w-[200px]">Mulai dengan membuat room atau gabung room temanmu!</p>
                            </div>
                            <JoinRoomCard />
                        </div>
                    ) : (
                        allActiveRooms.map((room) => {
                            const timeLeft = getTimeRemaining(room.deadline);
                            const isUrgent = timeLeft?.urgent;

                            return (
                                <button
                                    key={room.id}
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="w-full bg-white rounded-3xl p-5 shadow-card border border-gray-100 relative group active:scale-[0.98] transition-transform duration-200 text-left"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {isUrgent ? 'Closing Soon' : 'Open'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">#{room.roomCode}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-0.5 line-clamp-1">{room.eventName}</h4>
                                            <div className="flex items-center text-gray-500 text-sm line-clamp-1">
                                                <span className="material-icons-round text-base mr-1">restaurant</span>
                                                {room.restaurantName}
                                            </div>
                                            {room.deadline && (
                                                <div className="flex items-center text-gray-400 text-xs mt-1">
                                                    <span className="material-icons-round text-sm mr-1">event</span>
                                                    {new Date(room.deadline).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {/* Countdown Circle */}
                                        {timeLeft && !timeLeft.expired && (
                                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border ${isUrgent
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-primary/10 text-primary border-primary/10'
                                                } ml-2 shrink-0`}>
                                                <span className="text-xs font-bold">{timeLeft.text}</span>
                                                <span className="text-[9px] uppercase font-bold opacity-80">Left</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full h-px bg-gray-100 my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {/* We don't have avatars yet, so show participant count bubble */}
                                            <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                                +{room.participantCount || 0}
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                            Manage
                                            <span className="material-icons-round text-lg ml-1 transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}

                    {/* Bottom Spacer for Tab Bar */}
                    <div className="h-8"></div>
                </main>

                {/* Floating Action Button */}
                <div className="fixed bottom-28 right-6 z-30" style={{ right: 'max(1.5rem, calc(50% - 224px + 1.5rem))' }}>
                    <button
                        onClick={() => navigate('/join')}
                        className="group flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-full w-14 h-14 md:w-auto md:h-12 md:px-6 shadow-fab transition-all duration-300 active:scale-95"
                    >
                        <span className="material-icons-round text-3xl md:text-2xl md:mr-2 transition-transform group-hover:rotate-90">add</span>
                        <span className="hidden md:inline font-bold">Buat Room Baru</span>
                    </button>
                </div>

                {/* Bottom Navigation */}
                <BottomNav />
            </div>
        </div>
    );
}
