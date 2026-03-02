import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    documentId,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Generate a 6-digit room code
 */
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createRoom(hostUid, hostName, data) {
    const roomCode = generateRoomCode();
    const roomRef = doc(collection(db, 'rooms'));

    const roomData = {
        id: roomRef.id,
        roomCode,
        hostUid,
        hostName,
        eventName: data.eventName,
        restaurantName: data.restaurantName,
        deadline: data.deadline,
        notes: data.notes || '',
        status: 'open',
        createdAt: serverTimestamp(),
        participantCount: 0,
    };

    await setDoc(roomRef, roomData);
    return { id: roomRef.id, ...roomData };
}

export async function getRoomById(roomId) {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (!roomDoc.exists()) return null;
    return { id: roomDoc.id, ...roomDoc.data() };
}

export async function getRoomByCode(roomCode) {
    const q = query(collection(db, 'rooms'), where('roomCode', '==', roomCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const roomDoc = snapshot.docs[0];
    return { id: roomDoc.id, ...roomDoc.data() };
}

export async function getRoomsByHost(hostUid) {
    const q = query(
        collection(db, 'rooms'),
        where('hostUid', '==', hostUid),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function onRoomsByHostSnapshot(hostUid, callback, onError) {
    const q = query(
        collection(db, 'rooms'),
        where('hostUid', '==', hostUid),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(rooms);
    }, (error) => {
        if (onError) onError(error);
        else console.error("Error watching rooms:", error);
    });
}

export async function closeRoom(roomId) {
    await updateDoc(doc(db, 'rooms', roomId), {
        status: 'closed',
        closedAt: serverTimestamp(),
    });
}

export async function getRoomsByIds(roomIds) {
    if (!roomIds || roomIds.length === 0) return [];
    // Firestore 'in' query supports max 10 items. If more, we need to batch or loop. 
    // For simplicity, we'll fetch individually or use 'in' chunks. 
    // Let's use individual gets for now to avoid the 10 limit complexity unless simple.
    // actually, `documentId()` and `in` works.

    const chunks = [];
    for (let i = 0; i < roomIds.length; i += 10) {
        chunks.push(roomIds.slice(i, i + 10));
    }

    const rooms = [];
    for (const chunk of chunks) {
        const q = query(collection(db, 'rooms'), where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    }

    // Sort locally since we can't easily sort across multiple queries or by generic field with 'in'
    return rooms.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
}

export function onRoomSnapshot(roomId, callback) {
    return onSnapshot(doc(db, 'rooms', roomId), (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() });
        }
    });
}

export async function checkAndCloseExpiredRooms(hostUid) {
    // 1. Get all OPEN rooms by this host
    const q = query(
        collection(db, 'rooms'),
        where('hostUid', '==', hostUid),
        where('status', '==', 'open')
    );

    const snapshot = await getDocs(q);
    const now = new Date();
    const expiredRooms = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.deadline) {
            const deadline = new Date(data.deadline);
            if (deadline < now) {
                expiredRooms.push(doc.id);
            }
        }
    });

    if (expiredRooms.length > 0) {
        console.log(`Auto-closing ${expiredRooms.length} expired rooms...`);
        // Execute all updates in parallel
        await Promise.all(expiredRooms.map(id => closeRoom(id)));
    }

    return expiredRooms.length;
}
