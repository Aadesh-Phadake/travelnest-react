import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Redux Hooks
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
    // Get User from Redux
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout()); // Clear Redux state
        navigate('/login');
    };

    // ... (Keep your existing Navbar JSX exactly the same from here down) ...
    // Just replace useAuth references with the 'user' variable and 'handleLogout' function defined above.
    
    return (
        <nav className="bg-white border-b sticky top-0 z-50">
            {/* ... Paste your previous Navbar JSX content here ... */}
            {/* Example of checking user: */}
            {/* {!user ? (...) : (...)} */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between h-16">
                   {/* ... Logo ... */}
                   <div className="flex items-center gap-6">
                        <Link to="/listings" className="flex items-center group">
                            <img src="/logo.jpg" alt="TravelNest Logo" className="h-10 w-auto object-contain" />
                        </Link>
                        <Link to="/listings" className="hidden md:block px-5 py-2 rounded-full font-bold text-gray-700 hover:text-primary hover:bg-[#FDF3EB] transition-all duration-200">
                            Explore
                        </Link>
                   </div>

                   {/* ... Menu ... */}
                   <div className="hidden md:flex items-center space-x-6">
                        {user && user.role === 'manager' && (
                            <Link to="/create-listing" className="text-gray-600 hover:text-primary font-medium transition">List your property</Link>
                        )}
                        {!user ? (
                            <>
                                <Link to="/signup" className="text-gray-600 hover:text-primary font-medium transition">Sign Up</Link>
                                <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-full hover:brightness-90 transition font-medium shadow-sm">Login</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                {user.role === 'traveller' && (
                                    <Link to="/profile" className="text-gray-600 hover:text-primary font-medium transition">My Profile</Link>
                                )}
                                {user.role === 'manager' && (
                                    <Link to="/owner-dashboard" className="text-gray-600 hover:text-primary font-medium transition">Dashboard</Link>
                                )}
                                {(user.role === 'admin' || user.username === 'TravelNest') && (
                                    <Link to="/admin" className="text-primary font-bold hover:underline transition">Admin Panel</Link>
                                )}
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 font-medium transition">Logout</button>
                            </div>
                        )}
                   </div>
                   
                   {/* Mobile Menu Button (Keep existing logic) */}
                   <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-primary p-2">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                   </div>
               </div>
            </div>
            
            {/* Mobile Dropdown (Keep existing logic) */}
            {isOpen && (
                <div className="md:hidden bg-white border-t p-4 space-y-3 shadow-lg">
                    {/* ... mobile links ... */}
                    {!user ? (
                        <>
                            <Link to="/signup" className="block py-2 px-3">Sign Up</Link>
                            <Link to="/login" className="block py-2 px-3 text-primary font-bold">Login</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/profile" className="block py-2 px-3">My Profile</Link>
                            <button onClick={handleLogout} className="block w-full text-left py-2 px-3 text-red-500">Logout</button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;