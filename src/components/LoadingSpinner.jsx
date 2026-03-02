export default function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Memuat...</p>
            </div>
        </div>
    );
}
