import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { loginUser, registerUser, logoutUser } from '../services/authService';

const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (!user) {
                setUserData(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (currentUser) {
            setLoading(true);
            const ref = doc(db, 'users', currentUser.uid);
            const unsubUser = onSnapshot(ref, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("AuthContext: User data updated from Firestore:", data);
                    setUserData({ uid: currentUser.uid, ...data });
                } else {
                    // Start with basic auth info if doc doesn't exist yet
                    setUserData({ uid: currentUser.uid, phoneNumber: currentUser.phoneNumber });
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user data:", error);
                setLoading(false);
            });
            return () => unsubUser();
        } else {
            setUserData(null);
            // If we are not logged in, loading is done (handled by auth listener usually, but here too)
        }
    }, [currentUser]);

    async function login(phoneNumber, password) {
        return loginUser(phoneNumber, password);
    }

    async function register(phoneNumber, password, displayName) {
        return registerUser(phoneNumber, password, displayName);
    }

    async function logout() {
        return logoutUser();
    }

    const value = {
        currentUser,
        userData,
        loading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
