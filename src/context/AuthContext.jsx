// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getUserFromStorage, updateUserInStorage } from "../utils/userUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Initial state localStorage se load karo
        return getUserFromStorage();
    });

    // User update events listen karo
    useEffect(() => {
        const handleUserUpdate = (event) => {
            setUser(event.detail);
        };
        
        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    // Login function - user set karo aur storage update karo
    const login = (userData) => {
        setUser(userData);
        updateUserInStorage(userData);
    };

    // Logout function - user clear karo aur storage clear karo
    const logout = () => {
        setUser(null);
        localStorage.removeItem("transportUser");
    };

    // Update user function - profile update ke liye
    const updateUser = (userData) => {
        setUser(userData);
        updateUserInStorage(userData);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser: updateUser,  // setUser ab updateUser ko call karega
            login, 
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook
export const useAuth = () => {
    return useContext(AuthContext);
};