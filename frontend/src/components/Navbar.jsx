import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Redux Hooks
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    // Get User from Redux
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout()); // Clear Redux state
        navigate('/login');
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between h-16">
                   <div className="flex items-center gap-6">
                        <Link to="/listings" className="flex items-center group">
                            <img src="/logo.jpg" alt="TravelNest Logo" className="h-10 w-auto object-contain" />
                        </Link>
                        <Link to="/listings" className="hidden md:block px-5 py-2 rounded-full font-bold text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-[#FDF3EB] transition-all duration-200">
                            Explore
                        </Link>
                   </div>

                   <div className="hidden md:flex items-center space-x-6">
                        <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-300 hover:text-primary transition">
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        {user && user.role === 'manager' && (
                            <Link to="/create-listing" className="text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition">List your property</Link>
                        )}
                        {!user ? (
                            <>
                                <Link to="/signup" className="text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition">Sign Up</Link>
                                <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-full hover:brightness-90 transition font-medium shadow-sm">Login</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                {user.role === 'traveller' && (
                                    <Link to="/profile" className="text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition">My Profile</Link>
                                )}
                                {user.role === 'manager' && (
                                    <Link to="/manager/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary font-medium transition">Dashboard</Link>
                                )}
                                {(user.role === 'admin' || user.username === 'TravelNest') && (
                                    <Link to="/admin" className="text-primary font-bold hover:underline transition">Admin Panel</Link>
                                )}
                                <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-red-500 font-medium transition">Logout</button>
                            </div>
                        )}
                   </div>

                   <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-gray-300 hover:text-primary p-2">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                   </div>
               </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white dark:bg-gray-800 border-t p-4 space-y-3 shadow-lg">
                    {!user ? (
                        <>
                            <Link to="/signup" className="block py-2 px-3 text-gray-600 dark:text-gray-300">Sign Up</Link>
                            <Link to="/login" className="block py-2 px-3 text-primary font-bold">Login</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/profile" className="block py-2 px-3 text-gray-600 dark:text-gray-300">My Profile</Link>
                            <button onClick={handleLogout} className="block w-full text-left py-2 px-3 text-red-500">Logout</button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;