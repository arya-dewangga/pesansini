import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Maps phone number to a fake email for Firebase Auth.
 * e.g. "+6281234567890" → "6281234567890@bukber.app"
 */
function phoneToEmail(phoneNumber) {
    return `${phoneNumber}@bukber.app`;
}

export async function registerUser(phoneNumber, password, displayName) {
    const email = phoneToEmail(phoneNumber);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Create user doc in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        phoneNumber,
        displayName,
        createdAt: serverTimestamp(),
    }, { merge: true });

    return user;
}

export async function loginUser(phoneNumber, password) {
    const email = phoneToEmail(phoneNumber);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

export async function logoutUser() {
    return signOut(auth);
}

export async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
}


export async function updateUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
}

/**
 * Updates user display name and phone number (which changes Auth email).
 * Requires re-authentication if phone changes.
 * @param {string} currentPassword - Required if changing phone number
 */
export async function updateUserPhoneAndName(displayName, newPhoneNumber, currentPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    // 1. Update Display Name in Firestore (always)
    const updateData = { displayName };

    // 2. If phone number changed, update Auth email + Firestore phone
    if (newPhoneNumber && newPhoneNumber !== user.phoneNumber /* This check might be tricky since user.phoneNumber is not set by email auth, we rely on Firestore */) {
        // We actually need to check against current firestore data, but passed newPhoneNumber implies change intent
        // Let's assume the component checks if it changed.

        const newEmail = phoneToEmail(newPhoneNumber);

        if (newEmail !== user.email) {
            if (!currentPassword) {
                throw new Error('Password required to change phone number');
            }

            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update Email (which effectively changes "phone" login)
            await updateEmail(user, newEmail);

            updateData.phoneNumber = newPhoneNumber;
        }
    }

    // 3. Update Firestore
    await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });

    return true;
}
