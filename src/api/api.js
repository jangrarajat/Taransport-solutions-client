// api/api.js
import axios from "axios";
import { backendUrl } from "../utils/backendUrl";
import { updateUserInStorage } from "../utils/userUtils";

// Latest user data fetch karne ka function
export const fetchLatestUserData = async () => {
    try {
        const res = await axios.get(`${backendUrl}/api/user/me`, {
            withCredentials: true
        });
        
        if (res.data.success) {
            // Local storage update karein
            updateUserInStorage(res.data.user);
            return res.data.user;
        }
    } catch (error) {
        console.error("Failed to fetch latest user data", error);
    }
    return null;
};

export const refreshToken = async () => {
    try {
        const res = await axios.post(`${backendUrl}/api/user/refresh-token`, {}, {
            withCredentials: true 
        });

        if (res.data.success) {
            console.log("Token Refreshed via Cookies! ✅");
            
            // Token refresh ke baad latest user data bhi fetch karein
            await fetchLatestUserData();
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("Refresh token failed! ❌", error.response?.data);
        localStorage.removeItem("transportUser");
        window.location.href = "/auth"; 
        return false;
    }
};