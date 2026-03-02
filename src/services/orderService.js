import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function submitOrder(roomId, orderData) {
    const orderRef = await addDoc(collection(db, 'rooms', roomId, 'orders'), {
        ...orderData,
        createdAt: serverTimestamp(),
    });

    // Increment participant count
    await updateDoc(doc(db, 'rooms', roomId), {
        participantCount: increment(1),
    });

    // If user is logged in, add to their joinedRooms list
    if (orderData.participantUid) {
        console.log(`Submitting order: Adding room ${roomId} to joinedRooms for user ${orderData.participantUid}`);
        try {
            const userRef = doc(db, 'users', orderData.participantUid);
            await setDoc(userRef, {
                joinedRooms: arrayUnion(roomId)
            }, { merge: true });
            console.log("Successfully updated user joinedRooms");
        } catch (error) {
            console.error("FAILED to update user joinedRooms:", error);
        }
    } else {
        console.warn("SubmitOrder: No participantUid provided, skipping joinedRooms update");
    }

    return { id: orderRef.id, ...orderData };
}

export async function updateOrder(roomId, orderId, data) {
    await updateDoc(doc(db, 'rooms', roomId, 'orders', orderId), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteOrder(roomId, orderId) {
    await deleteDoc(doc(db, 'rooms', roomId, 'orders', orderId));
    await updateDoc(doc(db, 'rooms', roomId), {
        participantCount: increment(-1),
    });
}

export async function getOrdersByRoom(roomId) {
    const q = query(
        collection(db, 'rooms', roomId, 'orders'),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrderById(roomId, orderId) {
    const orderDoc = await getDoc(doc(db, 'rooms', roomId, 'orders', orderId));
    if (!orderDoc.exists()) return null;
    return { id: orderDoc.id, ...orderDoc.data() };
}

export function onOrdersSnapshot(roomId, callback) {
    const q = query(
        collection(db, 'rooms', roomId, 'orders'),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(orders);
    });
}
