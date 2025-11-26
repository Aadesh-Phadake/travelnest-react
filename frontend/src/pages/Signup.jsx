import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation (Matches your EJS patterns)
        const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{2,15}$/;
        const emailRegex = /[a-zA-Z0-9._%+-]+@gmail\.com$/;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!usernameRegex.test(formData.username)) {
            return toast.error("Username must start with a letter and be 3-16 chars.");
        }
        if (!emailRegex.test(formData.email)) {
            return toast.error("Only Gmail addresses are allowed.");
        }
        if (!passwordRegex.test(formData.password)) {
            return toast.error("Password must include 1 uppercase, 1 lowercase, 1 number, and 1 special char.");
        }
        if (!formData.role) {
            return toast.error("Please select an account type.");
        }

        try {
            await api.post('/signup', formData);
            toast.success("Welcome to TravelNest! Please login.");
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || "Signup failed");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Sign Up on TravelNest</h1>
                
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
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" name="email" onChange={handleChange} 
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                        <select 
                            name="role" onChange={handleChange} 
                            className="mt-1 block w-full p-2 border rounded-md bg-white"
                            required
                        >
                            <option value="">Select Account Type</option>
                            <option value="traveller">Traveller</option>
                            <option value="manager">Hotel Manager</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-primary text-white py-2 rounded-md hover:bg-red-600 transition">
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;