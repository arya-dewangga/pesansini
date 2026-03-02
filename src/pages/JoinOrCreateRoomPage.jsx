import { useNavigate } from 'react-router-dom';
import JoinRoomCard from '../components/JoinRoomCard';

export default function JoinOrCreateRoomPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light font-display text-gray-800 flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative flex flex-col">
                {/* Header */}
                <header className="px-6 pt-6 pb-4 flex items-center gap-4 sticky top-0 bg-background-light/95 backdrop-blur-sm z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-icons-round text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">Gabung atau Buat</h1>
                </header>

                <main className="flex-1 px-6 pt-4 pb-8 space-y-8">
                    {/* Create New Room Section */}
                    <section>
                        <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/30 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                            <div className="relative z-10">
                                <span className="material-icons-round text-4xl mb-3 bg-white/20 p-2 rounded-xl">add_business</span>
                                <h2 className="text-2xl font-extrabold mb-2">Buat Room Baru</h2>
                                <p className="text-white/90 text-sm mb-6 leading-relaxed">
                                    Jadi host, pilih restoran, dan bagikan link ke teman-temanmu untuk mulai memesan!
                                </p>
                                <button
                                    onClick={() => navigate('/create-room')}
                                    className="w-full py-3.5 bg-white text-primary font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Buat Room Sekarang</span>
                                    <span className="material-icons-round text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Atau</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Join Room Section */}
                    <section>
                        <JoinRoomCard />
                    </section>
                </main>
            </div>
        </div>
    );
}
