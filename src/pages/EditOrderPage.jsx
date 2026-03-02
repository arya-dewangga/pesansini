import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoomById } from '../services/roomService';
import { updateOrder, deleteOrder, onOrdersSnapshot } from '../services/orderService';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function EditOrderPage() {
    const { roomId, orderId } = useParams();
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
    const [isRemoveParticipantModalOpen, setRemoveParticipantModalOpen] = useState(false);

    // Form state
    const [items, setItems] = useState([]);
    const [generalNotes, setGeneralNotes] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const roomData = await getRoomById(roomId);
                setRoom(roomData);

                // We need to find the specific order. 
                // Since we don't have a direct getOrderById (based on previous files), 
                // we might need to subscribe to orders or fetch them.
                // onOrdersSnapshot returns unsubscribe.
                // But for editing a single order, maybe we just filter from the list?
                // Let's use onOrdersSnapshot to ensure we have fresh data.
            } catch (err) {
                console.error(err);
                toast.error('Gagal memuat data');
                navigate(`/room/${roomId}`);
            }
        }
        fetchData();

        const unsub = onOrdersSnapshot(roomId, (orders) => {
            const foundOrder = orders.find(o => o.id === orderId);
            if (foundOrder) {
                setOrder(foundOrder);
                // Only set items if we haven't touched them yet? 
                // Or always sync? For an edit form, usually we initial load, then let user edit.
                // But if we use real-time, it might overwrite user typing.
                // Let's just set it once when loading is true.
                setLoading(prev => {
                    if (prev) {
                        setItems(foundOrder.items || []);
                        setGeneralNotes(foundOrder.generalNotes || '');
                        return false;
                    }
                    return prev;
                });
            } else {
                setLoading(false); // Order not found
            }
        });

        return () => unsub();
    }, [roomId, orderId, navigate]);

    function increaseQty(index) {
        const newItems = [...items];
        newItems[index].quantity = (newItems[index].quantity || 1) + 1;
        setItems(newItems);
    }

    function decreaseQty(index) {
        const newItems = [...items];
        if (newItems[index].quantity > 1) {
            newItems[index].quantity -= 1;
            setItems(newItems);
        }
    }

    function removeItem(index) {
        setItemToDeleteIndex(index);
        setIsDeleteModalOpen(true);
    }

    function confirmDelete() {
        if (itemToDeleteIndex !== null) {
            const newItems = [...items];
            newItems.splice(itemToDeleteIndex, 1);
            setItems(newItems);
            setItemToDeleteIndex(null);
        }
    }

    function updateNote(index, text) {
        const newItems = [...items];
        newItems[index].notes = text;
        setItems(newItems);
    }

    function addNewItem() {
        setItems([...items, { menuName: 'Menu Baru', quantity: 1, notes: '' }]);
    }

    function updateMenuName(index, name) {
        const newItems = [...items];
        newItems[index].menuName = name;
        setItems(newItems);
    }

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    async function handleSave() {
        if (items.length === 0) {
            toast.error('Minimal harus ada 1 item');
            return;
        }

        setSubmitting(true);
        try {
            // Validate items
            const validItems = items
                .filter((it) => it.menuName.trim())
                .map((it) => ({
                    ...it,
                    menuName: toTitleCase(it.menuName.trim()), // Apply Title Case
                    quantity: parseInt(it.quantity) || 1
                }));

            await updateOrder(roomId, orderId, {
                ...order,
                items: validItems,
                generalNotes
            });
            toast.success('Pesanan berhasil diperbarui');
            navigate(`/room/${roomId}`);
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan perubahan');
        } finally {
            setSubmitting(false);
        }
    }

    function handleRemoveParticipant() {
        setRemoveParticipantModalOpen(true);
    }

    async function confirmRemoveParticipant() {
        setSubmitting(true);
        try {
            await deleteOrder(roomId, orderId);
            toast.success('Peserta berhasil dihapus');
            navigate(`/room/${roomId}`);
        } catch (error) {
            console.error(error);
            toast.error('Gagal menghapus peserta');
        } finally {
            setSubmitting(false);
            setRemoveParticipantModalOpen(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!order || !room) {
        return <div className="p-8 text-center">Data tidak ditemukan</div>;
    }

    return (
        <div className="min-h-screen bg-background-light font-display text-gray-800 flex flex-col items-center">
            <div className="w-full max-w-md h-full min-h-screen bg-background-light relative overflow-y-auto pb-40">
                {/* Header */}
                {/* Header */}
                <header className="px-6 pt-4 pb-2 flex items-center gap-4 sticky top-0 bg-background-light/95 backdrop-blur-sm z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-icons-round text-2xl">close</span>
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Edit Pesanan</h1>
                        <p className="text-xs text-gray-500 font-medium">Peserta: {order.participantName}</p>
                    </div>
                    <div className="w-10"></div>
                </header>

                <section className="px-6 py-4">
                    <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                        {order.participantName?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-gray-900">{order.participantName}</h2>
                                        <p className="text-xs text-gray-500">Participant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveParticipant}
                                    className="px-4 py-2 bg-red-50 text-red-500 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    <span className="material-icons-round text-base">person_remove</span>
                                    Hapus Peserta
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <main className="px-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Detail Pesanan</h3>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="bg-white rounded-3xl p-5 shadow-card border border-gray-100">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <span className="text-2xl">🍽️</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <input
                                                type="text"
                                                value={item.menuName}
                                                onChange={(e) => updateMenuName(index, e.target.value)}
                                                className="w-full bg-gray-50 border-gray-100 rounded-xl text-xs focus:ring-primary focus:border-primary placeholder:text-gray-400"
                                                placeholder="Nama Menu"
                                            />
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="text-red-500 p-1"
                                            >
                                                <span className="material-icons-round text-xl">delete_outline</span>
                                            </button>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 px-2">
                                                <button
                                                    onClick={() => decreaseQty(index)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm"
                                                >
                                                    <span className="material-icons-round text-sm">remove</span>
                                                </button>
                                                <span className="font-bold text-sm w-4 text-center text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => increaseQty(index)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm"
                                                >
                                                    <span className="material-icons-round text-sm">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500">
                                        <span className="material-icons-round text-sm">notes</span>
                                        Catatan Pesanan
                                    </div>
                                    <textarea
                                        value={item.notes || ''}
                                        onChange={(e) => updateNote(index, e.target.value)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl text-xs focus:ring-primary focus:border-primary placeholder:text-gray-400"
                                        placeholder="Contoh: Bumbu kacang dipisah..."
                                        rows="2"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addNewItem}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary transition-colors"
                        >
                            <span className="material-icons-round">add_circle_outline</span>
                            <span className="font-bold text-sm">Tambah Item Menu</span>
                        </button>
                    </div>
                </main>

                <div className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-gray-100 p-6 z-30 rounded-t-3xl">
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate(`/room/${roomId}`)}
                            className="flex-1 py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-900 font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="flex-[1.5] py-3.5 px-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-icons-round text-sm">save</span>
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Menu"
                message="Apakah Anda yakin ingin menghapus menu ini dari pesanan?"
                confirmText="Hapus"
                cancelText="Batal"
                isDestructive={true}
            />

            <ConfirmationModal
                isOpen={isRemoveParticipantModalOpen}
                onClose={() => setRemoveParticipantModalOpen(false)}
                onConfirm={confirmRemoveParticipant}
                title="Hapus Peserta?"
                message={`Apakah Anda yakin ingin menghapus ${order?.participantName || 'peserta ini'} dari room? Semua pesanannya akan dihapus permanen.`}
                confirmText="Hapus Peserta"
                cancelText="Batal"
                isDestructive={true}
            />
        </div>
    );
}
