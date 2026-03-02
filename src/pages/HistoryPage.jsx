import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomsByHost, getRoomsByIds } from '../services/roomService';
import BottomNav from '../components/BottomNav';

export default function HistoryPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRooms() {
            if (!userData?.uid) return;
            try {
                // 1. Fetch hosted rooms
                const hostedRooms = await getRoomsByHost(userData.uid);

                // 2. Fetch joined rooms (if any)
                let joinedRooms = [];
                if (userData.joinedRooms && userData.joinedRooms.length > 0) {
                    joinedRooms = await getRoomsByIds(userData.joinedRooms);
                }

                // 3. Combine and deduplicate (in case user is host AND joined? shouldn't happen but good practice)
                const allRoomsMap = new Map();
                hostedRooms.forEach(room => allRoomsMap.set(room.id, room));
                joinedRooms.forEach(room => allRoomsMap.set(room.id, room));

                const allRooms = Array.from(allRoomsMap.values());

                // 4. Sort: Active first, then by date desc
                const sorted = allRooms.sort((a, b) => {
                    if (a.status !== b.status) return a.status === 'closed' ? 1 : -1; // Active first (closed last)
                    // If same status, sort by date desc
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                setRooms(sorted);
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRooms();
    }, [userData]);

    function formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function getStatusBadge(status) {
        if (status === 'closed') {
            return (
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-icons-round text-xs">check_circle</span>
                    Selesai
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Aktif
            </span>
        );
    }

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative pb-28">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm px-6 pt-4 pb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900">Riwayat</h1>
                    <p className="text-gray-500 text-sm mt-1">Semua room yang pernah kamu ikuti</p>
                </header>

                {/* Room List */}
                <div className="px-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 shadow-card border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-gray-400 text-3xl">history</span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">Belum ada riwayat</h3>
                            <p className="text-gray-500 text-sm">Room yang kamu ikuti akan muncul di sini</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => navigate(`/room/${room.id}`)}
                                    className="w-full bg-white rounded-3xl p-5 shadow-card border border-gray-100 text-left active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-base font-bold text-gray-800">{room.eventName}</h4>
                                            <div className="flex items-center text-gray-500 text-sm mt-1">
                                                <span className="material-icons-round text-base mr-1 opacity-70">restaurant</span>
                                                {room.restaurantName}
                                            </div>
                                        </div>
                                        {getStatusBadge(room.status)}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
                                            <span className="flex items-center gap-1">
                                                <span className="material-icons-round text-sm">groups</span>
                                                {room.participantCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-icons-round text-sm">calendar_today</span>
                                                {formatDate(room.createdAt)}
                                            </span>
                                        </div>
                                        <span className="text-primary text-sm font-bold flex items-center">
                                            Detail
                                            <span className="material-icons-round text-lg ml-0.5">chevron_right</span>
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <BottomNav />
            </div>
        </div>
    );
}
