import React, { useState } from 'react'
import SuccessToster from '../toster/SuccessToster';
import axios from 'axios';
import ButtonLoaders from '../loaders/ButtonLoaders';
import { backendUrl } from '../../utils/backendUrl';
function Registration({ setAuthForm }) {
    const [name, setName] = useState("")
    const [number, setNumber] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState({ id: Date.now(), show: false, success: true, message: "" });

    const registrationApi = async () => {
        setLoading(true)
        try {
            const response = await axios.post(`${backendUrl}/user/registration`, { name, number, email, password, companyName })
            setToast({ id: Date.now(), show: true, success: true, message: "Registration Successful 🚛" });
            if (response.data.success) {
                setTimeout(() => setAuthForm("login"), 3000)
            }
        } catch (error) {
            setToast({ id: Date.now(), show: true, success: false, message: error.response?.data?.message || "Something went wrong" });
        } finally {
            setLoading(false)
        }
    };

    return (
        <>
            {toast.show && (<SuccessToster key={toast.id} success={toast.success} msg={toast.message} />)}
            <div className='w-96 min-h-64 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-white font-thin p-2 rounded-md'>
                <h1 className='uppercase text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500'>Registration</h1>
                <div className='w-full h-full flex flex-col p-2 pb-5'>
                    <label htmlFor="name" className='px-2 mt-4 text-white/70'>Fullname</label>
                    <input required onChange={(e) => setName(e.target.value)} type="text" id='name' placeholder='fullname' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                    <label htmlFor="number" className='px-2 mt-4 text-white/70'>Number</label>
                    <input required onChange={(e) => setNumber(e.target.value)} type='text' id='number' placeholder='number' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                    <label htmlFor="email" className='px-2 mt-4 text-white/70'>Email</label>
                    <input required onChange={(e) => setEmail(e.target.value)} type="email" id='email' placeholder='email' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                    <label htmlFor="password" className='px-2 mt-4 text-white/70'>Password</label>
                    <input required onChange={(e) => setPassword(e.target.value)} type="password" id='password' placeholder='password' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                    <label htmlFor="companyName" className='px-2 mt-4 text-white/70'>Company Name</label>
                    <input required onChange={(e) => setCompanyName(e.target.value)} type="text" id='companyName' placeholder='companyName' className='bg-white/5 border border-white/10 px-2 p-2 rounded-md outline-none focus:border-cyan-500' />
                </div>
                <button className='my-3 cursor-pointer hover:underline text-white/70' onClick={() => setAuthForm("login")}>I have an account</button>
                <div className='w-full flex flex-col gap-2'>
                    <button onClick={() => registrationApi()} className='h-12 flex justify-center p-2 items-center bg-gradient-to-r from-orange-500 to-orange-600 w-full rounded-md active:scale-95 duration-300 font-black uppercase text-xs tracking-widest'>
                        {loading ? (<ButtonLoaders />) : "Registration"}
                    </button>
                </div>
            </div>
        </>
    )
}

export default Registration;