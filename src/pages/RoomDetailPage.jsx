import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { copyTextToClipboard } from '../utils/clipboard';
import { onRoomSnapshot, closeRoom } from '../services/roomService';
import { onOrdersSnapshot } from '../services/orderService';
import { QRCodeSVG } from 'qrcode.react';
import BackButton from '../components/BackButton';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';

export default function RoomDetailPage() {
    const { id } = useParams();
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        const unsubRoom = onRoomSnapshot(id, (data) => {
            setRoom(data);
            setLoading(false);
        });
        const unsubOrders = onOrdersSnapshot(id, setOrders);
        return () => { unsubRoom(); unsubOrders(); };
    }, [id]);

    const orderLink = `${window.location.origin}/room/${id}/order`;
    const isHost = room?.hostUid === userData?.uid;

    function aggregateOrders() {
        const agg = {};
        orders.forEach((order) => {
            (order.items || []).forEach((item) => {
                const key = item.menuName;
                if (!agg[key]) agg[key] = { name: key, qty: 0, notes: [] };
                agg[key].qty += item.quantity || 1;
                if (item.notes) agg[key].notes.push(item.notes);
            });
        });

        // Group identical notes and count them
        return Object.values(agg).map(item => {
            const noteCounts = {};
            item.notes.forEach(note => {
                const normalizedNote = note.trim();
                if (normalizedNote) {
                    noteCounts[normalizedNote] = (noteCounts[normalizedNote] || 0) + 1;
                }
            });

            // Format notes as "Note (Count)" or just "Note" if count is 1
            const formattedNotes = Object.entries(noteCounts).map(([note, count]) => {
                // If the total aggregated quantity is > 1, show the count for each note to avoid confusion.
                // E.g. "Es Teh (2)" with 1 person asking "less sugar" -> "less sugar (1)"
                // If it's a single item, "Nasi Goreng (1)" with note "Pedas", we just show "Pedas"
                if (item.qty > 1) {
                    return `${note} (${count})`;
                }
                return count > 1 ? `${note} (${count})` : note;
            });

            return {
                ...item,
                notes: formattedNotes
            };
        });
    }

    async function handleCopyLink() {
        const success = await copyTextToClipboard(orderLink);
        if (success) {
            toast.success('Link berhasil disalin!');
        } else {
            toast.error('Gagal menyalin link');
        }
    }

    async function handleCopyOrders() {
        const aggregated = aggregateOrders();
        const text = aggregated.map((item) => {
            let line = `${item.name} x${item.qty}`;
            if (item.notes.length) line += ` (${item.notes.join(', ')})`;
            return line;
        }).join('\n');
        const full = `📋 Pesanan ${room?.eventName}\n🍽️ ${room?.restaurantName}\n\n${text}\n\n👥 Total: ${orders.length} peserta`;

        const success = await copyTextToClipboard(full);
        if (success) {
            toast.success('Pesanan disalin ke clipboard!');
        } else {
            toast.error('Gagal menyalin');
        }
    }

    function handleCloseRoom() {
        setIsConfirmModalOpen(true);
    }

    async function onConfirmCloseRoom() {
        try {
            await closeRoom(id);
            toast.success('Room berhasil ditutup');
        } catch { toast.error('Gagal menutup room'); }
    }

    const avatarColors = [
        'from-blue-400 to-blue-600', 'from-pink-400 to-pink-600', 'from-green-400 to-green-600',
        'from-purple-400 to-purple-600', 'from-yellow-400 to-orange-500', 'from-indigo-400 to-indigo-600',
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
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <p className="text-gray-500">Room tidak ditemukan</p>
            </div>
        );
    }

    const aggregated = aggregateOrders();

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md px-6 pt-4 pb-4 flex items-center justify-between border-b border-primary/5">
                    <BackButton />
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-bold">Room Detail</h1>
                        <span className="text-xs text-gray-500">{room.eventName}</span>
                        {room.deadline && (
                            <span className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(room.deadline).toLocaleString('id-ID', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        )}
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${room.status === 'open'
                        ? 'bg-green-100 border-green-200'
                        : 'bg-gray-100 border-gray-200'
                        }`}>
                        {room.status === 'open' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                        <span className={`text-xs font-semibold uppercase tracking-wider ${room.status === 'open' ? 'text-green-700' : 'text-gray-500'
                            }`}>
                            {room.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                    </div>
                </header>

                <main className="flex-1 px-6 pt-6 pb-40 flex flex-col gap-8">
                    {/* QR Code Section */}
                    <section className="flex flex-col items-center">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 w-full max-w-sm flex flex-col items-center border border-primary/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-8 -mb-8 blur-xl" />
                            <h2 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-widest text-center">
                                Scan to Join
                            </h2>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                                <QRCodeSVG value={orderLink} size={192} level="M" />
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full">
                                <p className="text-2xl font-bold tracking-tight text-gray-900">
                                    ID: {room.roomCode || id.slice(0, 6)}
                                </p>
                                <p className="text-xs text-center text-gray-400 mb-4 max-w-[200px]">
                                    Share this code or link with your friends to start ordering.
                                </p>
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full py-4 px-6 bg-primary/10 hover:bg-primary/20 text-primary rounded-full flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                                >
                                    <span className="material-icons-round text-xl">content_copy</span>
                                    Salin Link Undangan
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Order Summary */}
                    {aggregated.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-gray-900">Ringkasan Pesanan</h2>
                            <div className="bg-white p-5 rounded-2xl border border-primary/10 shadow-sm shadow-primary/5">
                                <div className="flex flex-col gap-4">
                                    {aggregated.map((item, i) => (
                                        <div key={i} className={i < aggregated.length - 1 ? 'border-b border-gray-100 pb-3' : ''}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-gray-800 font-semibold">{item.name}</span>
                                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                                                    {item.qty}x
                                                </span>
                                            </div>
                                            {item.notes.length > 0 && (
                                                <p className="text-xs text-gray-500 italic leading-relaxed">
                                                    ({item.notes.join(', ')})
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleCopyOrders}
                                className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                            >
                                <span className="material-icons-round text-lg">content_copy</span>
                                Salin Ringkasan
                            </button>
                        </section>
                    )}

                    {/* Participant List */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-xl font-bold text-gray-900">Daftar Pesanan</h2>
                            <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {orders.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {orders.length === 0 ? (
                                <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                                    <span className="material-icons-round text-4xl text-gray-300 mb-2">inbox</span>
                                    <p className="text-gray-400 text-sm">Belum ada pesanan masuk</p>
                                </div>
                            ) : (
                                orders.map((order, i) => {
                                    const initials = (order.participantName || 'A')
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2);
                                    const itemText = (order.items || [])
                                        .map((it) => `${it.menuName}${it.quantity > 1 ? ` (${it.quantity})` : ''}`)
                                        .join(', ');
                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => isHost && navigate(`/room/${room.id}/order/${order.id}/edit`)}
                                            className={`group bg-white p-4 rounded-2xl flex items-center gap-4 border border-transparent shadow-sm shadow-primary/5 transition-all ${isHost ? 'cursor-pointer hover:border-primary/30 hover:shadow-primary/10 active:scale-[0.99]' : ''
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{order.participantName}</h3>
                                                <p className="text-sm text-gray-500 truncate">{itemText}</p>
                                            </div>
                                            {isHost && (
                                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                                    <span className="material-icons-round text-lg">edit</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </main>

                {/* Footer Actions */}
                {isHost && room.status === 'open' && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-primary/10 px-6 pt-4 pb-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-3xl">
                        <div className="max-w-md mx-auto flex gap-4">
                            <button
                                onClick={handleCloseRoom}
                                className="flex-1 py-4 px-4 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-orange-600 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <span className="material-icons-round">lock</span>
                                Tutup Room
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={onConfirmCloseRoom}
                title="Tutup Room?"
                message="Yakin ingin menutup room ini? Pesanan tidak bisa ditambah lagi setelah room ditutup."
                confirmText="Ya, Tutup Room"
                cancelText="Batal"
                isDestructive={true}
            />
        </div >
    );
}
