import { useNavigate } from 'react-router-dom';

export default function BackButton({ onClick }) {
    const navigate = useNavigate();

    return (
        <button
            onClick={onClick || (() => navigate(-1))}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
        >
            <span className="material-icons-round text-gray-600">chevron_left</span>
        </button>
    );
}
