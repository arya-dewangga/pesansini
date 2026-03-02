import { useNavigate } from 'react-router-dom';

export default function DonationPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light flex flex-col items-center">
            <div className="w-full max-w-md min-h-screen bg-background-light relative">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md px-6 pt-4 pb-4 flex items-center justify-between border-b border-primary/5">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <span className="material-icons-round text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1 text-center pr-10">Dukungan Developer</h1>
                </header>

                <main className="flex-1 px-6 py-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <span className="material-icons-round text-4xl text-primary">volunteer_activism</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Traktir Kopi ☕</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Jika aplikasi ini membantu pesananmu, kamu bisa memberikan dukungan agar developer tetap semangat mengembangkan fitur-fitur menarik lainnya!
                    </p>

                    <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100 w-full mb-8 relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-primary"></div>

                        <p className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">Scan QRIS</p>

                        <div className="bg-white p-6 rounded-xl inline-block shadow-sm border border-gray-100">
                            <img
                                src="/assets/putary-qris-cropped.jpeg"
                                alt="QRIS Donation"
                                className="w-64 h-64 object-contain"
                            />
                        </div>

                        <p className="text-xs text-gray-400 mt-4">
                            Mendukung pembayaran via GoPay, OVO, Dana, ShopeePay, BCA, dll.
                        </p>
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-4 w-full text-left flex items-start gap-3">
                        <span className="material-icons-round text-primary mt-0.5">favorite</span>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Terima Kasih!</h3>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                Dukunganmu sangat berarti untuk biaya server dan pengembangan aplikasi ini kedepannya. Semoga berkah selalu! ✨
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
