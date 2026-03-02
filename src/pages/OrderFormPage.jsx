import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomById, onRoomSnapshot, closeRoom } from '../services/roomService';
import { submitOrder, updateOrder, onOrdersSnapshot } from '../services/orderService';
import toast from 'react-hot-toast';

export default function OrderFormPage() {
    const { id } = useParams();
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

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
    const [submitting, setSubmitting] = useState(false);
    const [orders, setOrders] = useState([]);

    // State for form
    const [participantName, setParticipantName] = useState('');
    const [participantPhone, setParticipantPhone] = useState('');
    const [items, setItems] = useState([{ menuName: '', quantity: 1, notes: '' }]);
    const [generalNotes, setGeneralNotes] = useState('');

    const myOrder = userData?.uid ? orders.find(o => o.participantUid === userData.uid) : null;
    const isEditing = !!myOrder; // If order exists, we are editing

    // Initialize form with user data if no existing order
    useEffect(() => {
        if (userData && !myOrder) {
            setParticipantName(userData.displayName || '');
            setParticipantPhone(userData.phoneNumber || '');
        }
    }, [userData, myOrder]);

    // Initialize form with existing order data if editing
    useEffect(() => {
        if (myOrder) {
            setParticipantName(myOrder.participantName || userData?.displayName || '');
            setParticipantPhone(myOrder.participantPhone || userData?.phoneNumber || '');
            setItems(myOrder.items || [{ menuName: '', quantity: 1, notes: '' }]);
            setGeneralNotes(myOrder.generalNotes || '');
        }
    }, [myOrder, userData]);

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

    function addItem() {
        setItems([...items, { menuName: '', quantity: 1, notes: '' }]);
    }

    function removeItem(index) {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    }

    function updateItem(index, field, value) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    }

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!participantName) {
            toast.error('Mohon isi nama');
            return;
        }

        const validItems = items
            .filter((it) => it.menuName.trim())
            .map((it) => ({
                ...it,
                menuName: toTitleCase(it.menuName.trim()),
            }));

        if (validItems.length === 0) {
            toast.error('Mohon isi minimal 1 menu');
            return;
        }
        if (room?.status !== 'open' || timeLeft?.expired) {
            toast.error('Room sudah ditutup');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                participantName,
                participantPhone,
                participantUid: userData?.uid || null,
                items: validItems,
                generalNotes,
            };

            if (myOrder) {
                // Update existing order
                await updateOrder(id, myOrder.id, payload);
                toast.success('Pesanan berhasil diperbarui!');
            } else {
                // Create new order
                await submitOrder(id, payload);
                toast.success('Pesanan berhasil dikirim!');
            }

            navigate(`/room/${id}/order`); // Redirect back to detail view
        } catch (err) {
            toast.error('Gagal mengirim pesanan');
            console.error(err);
        } finally {
            setSubmitting(false);
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
        <div className="min-h-screen bg-background-light font-display text-gray-800 flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative flex flex-col">
                {/* Header */}
                <header className="px-6 pt-4 pb-2 flex items-center gap-4 sticky top-0 bg-background-light/95 backdrop-blur-sm z-20">
                    <button onClick={() => {
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            navigate(`/room/${id}`);
                        }
                    }} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <span className="material-icons-round text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1 text-center pr-10">Detail Pesanan Saya</h1>
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
                            <div className="flex items-center text-gray-500 text-sm">
                                <span className="material-icons-round text-base mr-1 text-primary">storefront</span>
                                {room.restaurantName}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Host Info Card */}
                <div className="px-6 py-4 -mt-4 relative">
                    <div className="bg-white p-3 rounded-xl shadow-lg shadow-primary/5 border border-primary/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {room.hostName?.[0]?.toUpperCase() || 'H'}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Host</p>
                                <p className="text-sm font-bold text-gray-800">{room.hostName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Form */}
                <div className="flex-1 px-6 pb-8">
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            <span className="w-1 h-6 bg-primary rounded-full" />
                            {isEditing ? 'Edit Pesananmu' : 'Isi Pesananmu'}
                        </h2>

                        {(room.status !== 'open' || timeLeft?.expired) && (
                            <div className="mb-4 bg-red-50 border border-red-200/50 rounded-xl p-3 flex items-start gap-3">
                                <span className="material-icons-round text-red-500 text-lg">warning</span>
                                <p className="text-xs text-red-800 font-medium leading-relaxed">
                                    Room ini sudah ditutup. Pesanan baru tidak bisa dikirim.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">Nama</label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3.5 top-1.5 text-gray-400 text-lg flex ">person</span>
                                        <input
                                            type="text"
                                            value={participantName}
                                            onChange={(e) => setParticipantName(e.target.value)}
                                            readOnly={!!userData && !isEditing}
                                            disabled={true}
                                            className={`w-full pl-10 pr-3 py-2.5 border-0 ring-1 ring-gray-200 rounded-xl text-sm font-medium outline-none bg-gray-100 text-gray-500 cursor-not-allowed`}
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">WhatsApp</label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3.5 top-1.5 text-gray-400 text-lg">phone_iphone</span>
                                        <input
                                            type="tel"
                                            value={participantPhone}
                                            onChange={(e) => setParticipantPhone(e.target.value)}
                                            readOnly={!!userData && !isEditing}
                                            disabled={true}
                                            className={`w-full pl-10 pr-3 py-2.5 border-0 ring-1 ring-gray-200 rounded-xl text-sm font-medium outline-none bg-gray-100 text-gray-500 cursor-not-allowed`}
                                            placeholder="081234567890"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="group">
                                <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">Pilihan Menu</label>
                                <div className="mb-4 bg-amber-50 border border-amber-200/50 rounded-xl p-3 flex items-start gap-3">
                                    <span className="material-icons-round text-amber-500 text-lg">info</span>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Masukkan nama sesuai menu untuk memudahkan pencatatan
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2">
                                            <div className="flex items-start gap-2">
                                                <div className="relative flex-grow">
                                                    <span className="material-icons-round absolute left-3 top-2.5 text-gray-400 text-sm">restaurant_menu</span>
                                                    <input
                                                        type="text"
                                                        value={item.menuName}
                                                        onChange={(e) => updateItem(index, 'menuName', e.target.value)}
                                                        placeholder="Nama menu (misal: Sate Ayam)"
                                                        disabled={room.status === 'closed'}
                                                        className={`w-full pl-9 pr-3 py-2.5 border-0 ring-1 ring-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 shadow-sm ${room.status === 'closed' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-primary'}`}
                                                    />
                                                </div>
                                                {/* Quantity */}
                                                <div className={`flex items-center rounded-xl ring-1 ring-gray-200 h-[42px] px-1 shadow-sm shrink-0 ${room.status === 'closed' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                        disabled={room.status === 'closed'}
                                                        className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-icons-round text-base">remove</span>
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                                                        disabled={room.status === 'closed'}
                                                        className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-primary active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-icons-round text-base">add</span>
                                                    </button>
                                                </div>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        disabled={room.status === 'closed'}
                                                        className="w-[42px] h-[42px] flex items-center justify-center text-red-400 hover:text-red-500 bg-red-50 rounded-xl active:scale-90 transition-transform shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                        <span className="material-icons-round text-lg">delete_outline</span>
                                                    </button>
                                                )}
                                            </div>
                                            {/* Per-item notes */}
                                            <div className="ml-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">subdirectory_arrow_right</span>
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                    placeholder="Catatan: paha bawah, gula sedikit..."
                                                    disabled={room.status === 'closed'}
                                                    className={`flex-grow text-xs py-1.5 px-3 border-0 ring-1 ring-gray-100 rounded-lg text-gray-600 placeholder-gray-400 ${room.status === 'closed' ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-primary/50'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    disabled={room.status === 'closed'}
                                    className="mt-4 w-full py-2.5 border border-dashed border-primary/40 rounded-xl text-primary text-sm font-semibold hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                                >
                                    <span className="material-icons-round text-base">add_circle_outline</span>
                                    Tambah Menu Lain
                                </button>
                            </div>

                            {/* General Notes */}
                            <div className="group">
                                <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">
                                    Catatan Umum (Opsional)
                                </label>
                                <div className="relative">
                                    <span className="material-icons-round absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">edit_note</span>
                                    <input
                                        type="text"
                                        value={generalNotes}
                                        onChange={(e) => setGeneralNotes(e.target.value)}
                                        placeholder="Jangan pedas, es dipisah, dll."
                                        disabled={room.status === 'closed'}
                                        className={`w-full pl-11 pr-4 py-3 border-0 ring-1 ring-gray-200 rounded-xl text-gray-800 placeholder-gray-400 shadow-sm transition-shadow ${room.status === 'closed' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-primary'}`}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting || room.status !== 'open'}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-gray-400"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>{isEditing ? 'Simpan Perubahan' : 'Kirim Pesanan'}</span>
                                        <span className="material-icons-round text-lg">send</span>
                                    </>
                                )}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="w-full py-3 text-gray-500 font-semibold"
                                >
                                    Batal Edit
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Transparency - Other orders */}
                    {orders.length > 0 && (
                        <>
                            <div className="relative flex py-2 items-center mb-8">
                                <div className="flex-grow border-t border-gray-200" />
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-widest">Transparansi</span>
                                <div className="flex-grow border-t border-gray-200" />
                            </div>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                                        Daftar Pesanan Saat Ini
                                    </h2>
                                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                                        {orders.length} Peserta
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {orders.map((order, i) => {
                                        const initials = (order.participantName || 'A')
                                            .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
                                        const itemText = (order.items || [])
                                            .map((it) => `${it.menuName} (${it.quantity})`)
                                            .join(', ');
                                        return (
                                            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-bold shadow-sm text-sm`}>
                                                    {initials}
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="font-bold text-gray-800 text-sm">{order.participantName}</h3>
                                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{itemText}</p>
                                                    {order.generalNotes && (
                                                        <div className="mt-2 flex items-center gap-1 text-xs text-primary bg-primary/5 inline-flex px-2 py-1 rounded-lg">
                                                            <span className="material-icons-round text-[14px]">sticky_note_2</span>
                                                            <span>{order.generalNotes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-8 mb-6 text-center">
                        <p className="text-xs text-gray-400">
                            Dibuat dengan ❤️ by Putary
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
