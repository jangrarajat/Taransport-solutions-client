import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { useNavigate } from "react-router-dom";
import { backendUrl } from '../../utils/backendUrl';
function Login({ setAuthForm }) {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

    const loginApi = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/user/login`, { email, password }, { withCredentials: true });
            setUser(response.data.responseUser);
            localStorage.setItem("transportUser", JSON.stringify(response.data.responseUser));
            setToast({ id: Date.now(), show: true, success: true, message: "Login Successful 🚛" });
            if (response.data.success) {
                setTimeout(() => navigate("/"), 2000);
            }
        } catch (error) {
            setToast({ id: Date.now(), show: true, success: false, message: error.response?.data?.message || "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='w-96 min-h-64 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-white font-thin p-2 rounded-md'>
            {toast.show && (<SuccessToster key={toast.id} success={toast.success} msg={toast.message} />)}
            <h1 className='uppercase text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500'>Login</h1>
            <div className='w-full h-full flex flex-col p-2 pb-5'>
                <label htmlFor="email" className='px-2 mt-4 text-white/70'>Email</label>
                <input onChange={(e) => setEmail(e.target.value)} type="email" id='email' placeholder='email' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                <label htmlFor="password" className='px-2 mt-4 text-white/70'>Password</label>
                <input onChange={(e) => setPassword(e.target.value)} type="password" id='password' placeholder='password' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
            </div>
            <button className='my-3 cursor-pointer hover:underline text-white/70' onClick={() => setAuthForm("registration")}>don't have account</button>
            <button onClick={loginApi} className='flex justify-center items-center p-2 bg-gradient-to-r from-cyan-500 to-blue-600 w-[90%] rounded-md font-black uppercase text-xs tracking-widest h-12'>
                {loading ? (<ButtonLoaders />) : "Login"}
            </button>
        </div>
    )
}

export default Login;