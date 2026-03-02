import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomByCode } from '../services/roomService';
import toast from 'react-hot-toast';

export default function JoinRedirectPage() {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function resolveRoom() {
            if (!code) {
                navigate('/');
                return;
            }

            try {
                const room = await getRoomByCode(code);
                if (room) {
                    navigate(`/room/${room.id}`, { replace: true });
                } else {
                    toast.error('Room tidak ditemukan');
                    navigate('/join', { replace: true });
                }
            } catch (error) {
                console.error('Error resolving room code:', error);
                toast.error('Terjadi kesalahan');
                navigate('/', { replace: true });
            }
        }

        resolveRoom();
    }, [code, navigate]);

    return (
        <div className="min-h-screen bg-background-light flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );
}
