import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomById, onRoomSnapshot, closeRoom } from '../services/roomService';
import { onOrdersSnapshot } from '../services/orderService';
import { copyTextToClipboard } from '../utils/clipboard';
import toast from 'react-hot-toast';

export default function RoomPage() {
    const { id } = useParams();
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    // Derived state for user's existing order
    const myOrder = userData?.uid ? orders.find(o => o.participantUid === userData.uid) : null;
    const otherOrders = orders.filter(o => o.id !== myOrder?.id);

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

    const timeLeft = getTimeRemaining(room?.deadline);

    // Initial redirect check - REMOVED

    useEffect(() => {
        const unsubscribe = onRoomSnapshot(id, (data) => {
            setRoom(data);
            setLoading(false);

            // Auto-close if deadline passed (Only Host can write)
            if (data.status === 'open' && data.deadline) {
                if (new Date(data.deadline) < new Date()) {
                    if (userData?.uid === data.hostUid) {
                        closeRoom(data.id).catch(console.error);
                    }
                }
            }
        });
        const unsubscribeOrders = onOrdersSnapshot(id, setOrders);
        return () => { unsubscribe(); unsubscribeOrders(); };
    }, [id]);


    async function handleShare() {
        const shareUrl = room?.roomCode
            ? `${window.location.origin}/j/${room.roomCode}`
            : window.location.href;

        const success = await copyTextToClipboard(shareUrl);
        if (success) {
            toast.success('Link disalin!');
        } else {
            toast.error('Gagal menyalin link');
        }
    }

    // Colors for avatars
    const avatarColors = [
        'from-blue-400 to-blue-600', 'from-pink-400 to-pink-600', 'from-green-400 to-green-600',
        'from-purple-400 to-purple-600', 'from-yellow-400 to-orange-500',
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center px-6">
                <div className="text-center">
                    <span className="material-icons-round text-6xl text-gray-300 mb-4">error_outline</span>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Room Tidak Ditemukan</h2>
                    <p className="text-gray-500 text-sm">Link mungkin salah atau room sudah dihapus.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md px-6 pt-4 pb-4 flex items-center justify-between border-b border-primary/5">
                    <button onClick={() => {
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            navigate('/dashboard');
                        }
                    }} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <span className="material-icons-round text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1 text-center pr-10">Info room</h1>
                </header>

                <section className="px-6 py-4">
                    <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${room.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {room.status === 'open' ? 'Open Order' : 'Closed'}
                                </span>
                                {/* Timer or Open Status */}
                                {timeLeft && !timeLeft.expired ? (
                                    <div className="flex flex-col items-end">
                                        <div className={`flex items-center gap-1 font-bold text-xs ${timeLeft.urgent ? 'text-red-500' : 'text-orange-500'}`}>
                                            <span className="material-icons-round text-sm">timer</span>
                                            <span>{timeLeft.text} Left</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {new Date(room.deadline).toLocaleString('id-ID', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                ) : room.deadline && (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-gray-400 font-semibold text-xs">
                                            <span className="material-icons-round text-sm">timer_off</span>
                                            <span>Ended</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {new Date(room.deadline).toLocaleString('id-ID', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{room.eventName}</h2>
                            <div className="flex items-center text-gray-500 text-sm mb-4">
                                <span className="material-icons-round text-base mr-1 text-primary">storefront</span>
                                {room.restaurantName}
                            </div>
                            <button
                                onClick={() => navigate(`/room/${room.id}/details`)}
                                className="w-full mb-4 bg-gray-50 border border-gray-100 text-primary font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined text-xl">qr_code_2</span>
                                <span className="text-sm">Lihat Detail Room</span>
                            </button>
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <div className="flex -space-x-2">
                                    {otherOrders.slice(0, 3).map((o, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold`}>
                                            {o.participantName[0]}
                                        </div>
                                    ))}
                                </div>
                                {otherOrders.length > 0 && (
                                    <span className="text-xs text-gray-500 font-medium">+{otherOrders.length} others joined</span>
                                )}
                                {otherOrders.length === 0 && (
                                    <span className="text-xs text-gray-500 font-medium">Be the first to join!</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <main className="px-6 pb-32">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Pesanan Saya</h3>
                    </div>
                    <div className="bg-white rounded-3xl p-5 shadow-card border border-gray-100 mb-6">
                        {myOrder ? (
                            <>
                                {myOrder.items.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                                                <span className="text-2xl">🍽️</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900">{item.menuName}</h4>
                                                {item.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.notes}</p>}
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {idx < myOrder.items.length - 1 && <div className="h-px w-full bg-gray-100 mb-4"></div>}
                                    </div>
                                ))}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => navigate(`/room/${id}/form`)}
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
                                    >
                                        <span className="material-icons-round text-lg">edit_note</span>
                                        Edit Pesanan
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <h2 className="text-lg font-bold">Belum Ada Pesanan</h2>
                                <p className="text-gray-500 mb-4">Kamu belum memesan di room ini.</p>
                                {room.status === 'open' ? (
                                    <button onClick={() => navigate(`/room/${id}/form`)} className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/20">
                                        Pesan Sekarang
                                    </button>
                                ) : (
                                    <p className="text-red-500 font-bold">Room sudah ditutup.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {otherOrders.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Pesanan Teman Lain</h3>
                            <div className="space-y-3">
                                {otherOrders.slice(0, 3).map((order, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (userData?.uid === room.hostUid) {
                                                navigate(`/room/${id}/order/${order.id}/edit`);
                                            }
                                        }}
                                        className={`bg-white p-4 rounded-2xl border border-gray-100 flex items-start gap-3 ${userData?.uid === room.hostUid ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                            {order.participantName[0]}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-sm text-gray-900">{order.participantName}</h5>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {order.items.map(it => `${it.menuName} (${it.quantity})`).join(', ')}
                                            </p>
                                        </div>
                                        {userData?.uid === room.hostUid && (
                                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors self-center">
                                                <span className="material-icons-round text-lg">edit</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {otherOrders.length > 3 && (
                                    <button
                                        onClick={() => {
                                            // Ideally this should expand the list, but for now we'll just keep the button
                                            // Or navigate to the room detail where all list is shown?
                                            // The user constraint was to "implement the edit from the /order for host"
                                            // But the list is truncated here.
                                            // Let's redirect to RoomDetail for "View All" which has the full list and edit capability
                                            navigate(`/room/${id}`);
                                        }}
                                        className="w-full py-3 text-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                                    >
                                        Lihat Semua Pesanan ({otherOrders.length - 3} lagi)
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <div className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-gray-100 p-6 z-30 rounded-t-3xl">
                    <div className="flex gap-4">
                        <button onClick={handleShare} className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors">
                            Share Link
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="flex-[1.5] py-3.5 px-4 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-600/20 transition-colors flex items-center justify-center gap-2">
                            <span className="material-icons-round text-sm">check_circle</span>
                            Sudah Benar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
