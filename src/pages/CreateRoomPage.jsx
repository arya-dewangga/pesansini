import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createRoom } from '../services/roomService';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';

export default function CreateRoomPage() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [eventName, setEventName] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('16:00');
    const [hasDeadline, setHasDeadline] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!eventName || !restaurantName) {
            toast.error('Mohon isi semua field wajib');
            return;
        }

        if (hasDeadline && !deadlineDate) {
            toast.error('Mohon isi tanggal deadline');
            return;
        }

        setLoading(true);
        try {
            let deadline = null;
            if (hasDeadline) {
                deadline = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();
            }

            const room = await createRoom(userData.uid, userData.displayName, {
                eventName,
                restaurantName,
                deadline,
                notes,
            });
            toast.success('Room berhasil dibuat!');
            navigate(`/room/${room.id}`);
        } catch (err) {
            toast.error('Gagal membuat room');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative flex flex-col">
                {/* Header */}
                <header className="px-6 pt-4 pb-4 flex items-center justify-between sticky top-0 z-20 bg-background-light/90 backdrop-blur-md">
                    <BackButton />
                    <h1 className="text-lg font-bold text-center flex-1">Buat Room Baru</h1>
                    <div className="w-10" />
                </header>

                {/* Banner */}
                <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar">
                    <div className="mb-8 mt-2 relative overflow-hidden rounded-2xl bg-primary/10 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50" />
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                        <div className="absolute left-8 top-8 w-16 h-16 bg-orange-300/20 rounded-full blur-xl" />
                        <div className="relative z-10 text-center">
                            <span className="material-icons-round text-4xl text-primary mb-1">diversity_3</span>
                            <p className="text-sm font-medium text-primary/80">Ajak teman lebih mudah</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Event Name */}
                        <div className="group">
                            <label htmlFor="eventName" className="block text-sm font-semibold text-gray-700 mb-2 pl-1">
                                Nama Acara
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors flex ">
                                    <span className="material-icons-round text-[20px]">edit</span>
                                </span>
                                <input
                                    id="eventName"
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="Contoh: Bukber Alumni SMA 1"
                                    className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-base font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Restaurant */}
                        <div className="group">
                            <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-700 mb-2 pl-1">
                                Lokasi Acara
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors flex ">
                                    <span className="material-icons-round text-[20px]">restaurant</span>
                                </span>
                                <input
                                    id="restaurantName"
                                    type="text"
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    placeholder="Nama restoran..."
                                    className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-base font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Deadline */}
                        <div>
                            <div className="flex items-center justify-between mb-2 pl-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Batas Pesanan (Deadline)
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer relative">
                                    <input
                                        type="checkbox"
                                        checked={hasDeadline}
                                        onChange={(e) => setHasDeadline(e.target.checked)}
                                        className="w-5 h-5 rounded-md border-gray-300 text-primary focus:ring-primary/50 transition-all"
                                    />
                                    <span className="text-sm font-medium text-gray-600">Aktifkan</span>
                                </label>
                            </div>

                            {hasDeadline && (
                                <div className="flex gap-3 animate-fade-in">
                                    <div className="flex-1 relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none flex">
                                            <span className="material-icons-round text-[20px]">calendar_today</span>
                                        </span>
                                        <input
                                            type="date"
                                            value={deadlineDate}
                                            onChange={(e) => setDeadlineDate(e.target.value)}
                                            onClick={(e) => e.target.showPicker?.()}
                                            required={hasDeadline}
                                            className={`w-full bg-white border-none rounded-2xl py-4 pl-12 pr-3 text-base font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all ${!deadlineDate ? 'text-gray-400' : 'text-gray-700'
                                                }`}
                                        />
                                    </div>
                                    <div className="w-1/3 relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none flex">
                                            <span className="material-icons-round text-[20px]">schedule</span>
                                        </span>
                                        <input
                                            type="time"
                                            value={deadlineTime}
                                            onChange={(e) => setDeadlineTime(e.target.value)}
                                            className="w-full bg-white border-none rounded-2xl py-4 pl-10 pr-2 text-base font-medium text-gray-700 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all text-center"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="group pb-4">
                            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2 pl-1">
                                Catatan Tambahan <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Misal: Bawa uang cash ya, dresscode putih..."
                                rows={4}
                                className="w-full bg-white border-none rounded-2xl p-4 text-base font-medium placeholder-gray-400 focus:ring-2 focus:ring-primary/50 shadow-sm resize-none transition-all"
                            />
                        </div>
                    </form>
                </main>

                {/* Submit Button */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-light via-background-light to-transparent pt-12">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-orange-600 active:scale-[0.98] text-white font-bold text-lg py-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-icons-round">link</span>
                                <span>Buat & Bagikan Link</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
