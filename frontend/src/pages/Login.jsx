import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Redux Hooks
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../redux/authSlice';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Get state from Redux Store
    const { loading, error, user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({ username: '', password: '' });

    // React to Redux state changes
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError()); // Clear error after showing it
        }
        if (user) {
            toast.success(`Welcome back, ${user.username}!`);
            navigate('/listings');
        }
    }, [error, user, navigate, dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Dispatch the Login Thunk
        dispatch(loginUser(formData));
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
                    <button 
                        type="submit" 
                        disabled={loading} // Disable button while loading
                        className="w-full bg-primary text-white py-2 rounded-md hover:bg-red-600 transition disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;