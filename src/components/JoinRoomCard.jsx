import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoomByCode } from '../services/roomService';
import toast from 'react-hot-toast';

export default function JoinRoomCard() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState('');
    const [joining, setJoining] = useState(false);

    async function handleJoin(e) {
        e.preventDefault();
        if (!roomCode || roomCode.length < 6) {
            toast.error('Masukkan 6 digit kode room');
            return;
        }

        setJoining(true);
        try {
            const room = await getRoomByCode(roomCode);
            if (room) {
                if (room.status === 'closed') {
                    toast.error('Room ini sudah ditutup');
                } else {
                    toast.success('Room ditemukan!');
                    navigate(`/room/${room.id}`);
                }
            } else {
                toast.error('Room tidak ditemukan');
            }
        } catch (error) {
            console.error(error);
            toast.error('Gagal bergabung ke room');
        } finally {
            setJoining(false);
        }
    }

    return (
        <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
            <div className="mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <span className="material-icons-round text-xl">login</span>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Gabung Room</h3>
                    <p className="text-gray-500 text-xs">Masuk menggunakan kode room</p>
                </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                        Kode Room (6 Digit)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="numeric"
                            value={roomCode}
                            onChange={(e) => {
                                if (e.target.value.length <= 6) setRoomCode(e.target.value);
                            }}
                            placeholder="Contoh: 123456"
                            className="w-full text-center text-2xl tracking-widest font-mono py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-300 outline-none transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={joining || roomCode.length < 6}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {joining ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>Gabung Room</span>
                            <span className="material-icons-round text-lg">login</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
