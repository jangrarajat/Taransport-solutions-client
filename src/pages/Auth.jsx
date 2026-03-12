import React, { useState } from 'react'
import Login from '../components/authForm/Login'
import Registration from '../components/authForm/Registration'

function Auth() {
    const [info, setInfo] = useState(true)
    const [authForm, setAuthForm] = useState("option")

    return (
        <>
            {/* AUTH SECTION */}
            <div className="w-full fixed h-screen z-10 
                bg-[url('https://images.pexels.com/photos/29057942/pexels-photo-29057942.jpeg')] 
                bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-3">

                {authForm === "option" ? (
                    <div className="bg-black/60 backdrop-blur-md p-5 sm:p-8 rounded-xl text-center text-white w-full max-w-sm shadow-2xl">
                        <h1 className="text-xl sm:text-2xl font-bold mb-2">
                            Transport Management
                        </h1>
                        <p className="text-xs sm:text-sm mb-4 text-gray-200 font-thin">
                            Manage trips, revenue & expenses in one dashboard.
                        </p>
                        <div className='flex flex-col sm:flex-row gap-2 w-full justify-center'>
                            <button
                                onClick={() => setAuthForm("registration")}
                                className="bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-md font-semibold duration-300 text-sm w-full sm:w-auto">
                                Register
                            </button>
                            <button
                                onClick={() => setAuthForm("login")}
                                className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-md font-semibold duration-300 text-sm w-full sm:w-auto">
                                Login
                            </button>
                        </div>
                    </div>
                ) : null}

                {authForm === "login" ? <Login setAuthForm={setAuthForm} /> : null}
                {authForm === "registration" ? <Registration setAuthForm={setAuthForm} /> : null}
            </div>

            {/* INTRO / OVERVIEW SECTION */}
            <div className={`w-full fixed h-screen z-20 
                flex items-center justify-center px-3
                bg-[url('https://images.pexels.com/photos/29057942/pexels-photo-29057942.jpeg')] 
                bg-cover bg-center bg-no-repeat text-white
                ${info ? "top-0" : "-top-full"} duration-500`}>

                <div className="absolute inset-0 bg-black/70"></div>

                <div className="relative z-10 max-w-4xl w-full px-2 py-4 text-center">
                    <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold uppercase mb-2">
                        Smart Transport Solution
                    </h1>

                    <p className="text-xs sm:text-sm md:text-base text-gray-200 mb-4 font-thin max-w-2xl mx-auto">
                        Complete digital system for transport business – from trip entry to payment tracking.
                    </p>

                    {/* FEATURES GRID – compact */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 font-thin">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg shadow-lg">
                            <h3 className="text-sm sm:text-base font-bold mb-1">Trip Mgmt</h3>
                            <p className="text-xs text-gray-200">Freight, diesel, advance, commission.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg shadow-lg">
                            <h3 className="text-sm sm:text-base font-bold mb-1">Revenue</h3>
                            <p className="text-xs text-gray-200">Auto calc, weekly/monthly reports.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg shadow-lg">
                            <h3 className="text-sm sm:text-base font-bold mb-1">Smart Reports</h3>
                            <p className="text-xs text-gray-200">Vehicle-wise insights, analytics.</p>
                        </div>
                    </div>

                    {/* WHY CHOOSE US – minimal */}
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg mb-4 inline-block mx-auto">
                        <h3 className="text-sm sm:text-base font-bold mb-1">Why Us?</h3>
                        <ul className="text-xs text-gray-200 flex flex-wrap justify-center gap-x-3">
                            <li>✔ Easy UI</li>
                            <li>✔ Secure</li>
                            <li>✔ Transport Focus</li>
                            <li>✔ Profit++</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setInfo(!info)}
                        className="px-6 py-2 bg-blue-700 hover:bg-blue-800 rounded-md font-semibold text-sm sm:text-base duration-300">
                        Get Started
                    </button>
                </div>
            </div>
        </>
    )
}

export default Auth