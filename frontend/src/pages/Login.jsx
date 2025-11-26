import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/login', formData);
            // res.data.user comes from your updated backend userController
            login(res.data.user); 
            toast.success("Welcome back!");
            navigate('/listings');
        } catch (error) {
            toast.error("Invalid username or password");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login to TravelNest</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input 
                            type="text" name="username" onChange={handleChange} 
                            className="mt-1 block w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password" name="password" onChange={handleChange} 
                            className="mt-1 block w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-red-600 transition">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;