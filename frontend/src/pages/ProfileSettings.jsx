import { Camera, Eye, EyeOff, Lock, Save, Settings, Upload, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ProfileSettings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Form states for different roles
    const [travellerData, setTravellerData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        travelPreferences: '',
        profilePhoto: null,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [ownerData, setOwnerData] = useState({
        name: '',
        email: '',
        hotelName: '',
        hotelAddress: '',
        phone: '',
        profilePhoto: null,
        documents: [],
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [adminData, setAdminData] = useState({
        name: '',
        email: '',
        role: '',
        profilePhoto: null,
        systemAccess: [],
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/profile');
            const userData = res.data.user;
            setUser(userData);

            // Initialize form data based on role
            if (userData.role === 'traveller') {
                setTravellerData({
                    ...travellerData,
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    travelPreferences: userData.travelPreferences || ''
                });
            } else if (userData.role === 'manager') {
                setOwnerData({
                    ...ownerData,
                    name: userData.name || '',
                    email: userData.email || '',
                    hotelName: userData.hotelName || '',
                    hotelAddress: userData.hotelAddress || '',
                    phone: userData.phone || '',
                    documents: userData.documents || []
                });
            } else if (userData.role === 'admin') {
                setAdminData({
                    ...adminData,
                    name: userData.name || '',
                    email: userData.email || '',
                    role: userData.role || '',
                    systemAccess: userData.systemAccess || []
                });
            }
        } catch (error) {
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            let formData = new FormData();
            let endpoint = '/profile/update';

            if (user.role === 'traveller') {
                formData.append('name', travellerData.name);
                formData.append('email', travellerData.email);
                formData.append('phone', travellerData.phone);
                formData.append('address', travellerData.address);
                formData.append('travelPreferences', travellerData.travelPreferences);
                if (travellerData.profilePhoto) {
                    formData.append('profilePhoto', travellerData.profilePhoto);
                }
            } else if (user.role === 'manager') {
                formData.append('name', ownerData.name);
                formData.append('email', ownerData.email);
                formData.append('hotelName', ownerData.hotelName);
                formData.append('hotelAddress', ownerData.hotelAddress);
                formData.append('phone', ownerData.phone);
                if (ownerData.profilePhoto) {
                    formData.append('profilePhoto', ownerData.profilePhoto);
                }
                const existingDocuments = ownerData.documents.filter(doc => typeof doc === 'string');
                formData.append('existingDocuments', JSON.stringify(existingDocuments));
                const newDocuments = ownerData.documents.filter(doc => doc instanceof File);
                newDocuments.forEach(doc => formData.append('documents', doc));
            } else if (user.role === 'admin') {
                formData.append('name', adminData.name);
                formData.append('email', adminData.email);
                if (adminData.profilePhoto) {
                    formData.append('profilePhoto', adminData.profilePhoto);
                }
                formData.append('systemAccess', JSON.stringify(adminData.systemAccess));
            }

            await api.put(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Profile updated successfully!');
            navigate('/profile'); // Redirect to profile page
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (user.role === 'traveller' && travellerData.newPassword !== travellerData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (user.role === 'manager' && ownerData.newPassword !== ownerData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (user.role === 'admin' && adminData.newPassword !== adminData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            const passwordData = user.role === 'traveller' ? {
                currentPassword: travellerData.currentPassword,
                newPassword: travellerData.newPassword
            } : user.role === 'manager' ? {
                currentPassword: ownerData.currentPassword,
                newPassword: ownerData.newPassword
            } : {
                currentPassword: adminData.currentPassword,
                newPassword: adminData.newPassword
            };

            await api.put('/profile/change-password', passwordData);
            toast.success('Password changed successfully!');

            // Clear password fields
            if (user.role === 'traveller') {
                setTravellerData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            } else if (user.role === 'manager') {
                setOwnerData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            } else {
                setAdminData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (user.role === 'traveller') {
            setTravellerData(prev => ({ ...prev, profilePhoto: file }));
        } else if (user.role === 'manager') {
            if (type === 'photo') {
                setOwnerData(prev => ({ ...prev, profilePhoto: file }));
            } else if (type === 'documents') {
                setOwnerData(prev => ({ ...prev, documents: [...prev.documents, file] }));
            }
        } else if (user.role === 'admin') {
            setAdminData(prev => ({ ...prev, profilePhoto: file }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <Settings className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-4 text-sm font-medium transition-all ${
                                activeTab === 'profile'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-4 text-sm font-medium transition-all ${
                                activeTab === 'security'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Security & Password
                        </button>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-6 space-y-8">
                            {/* Profile Photo */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                        {user?.profilePhoto ? (
                                            <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-gray-400" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition">
                                        <Camera className="w-4 h-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'photo')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Photo</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile picture</p>
                                </div>
                            </div>

                            {/* Role-specific fields */}
                            {user?.role === 'traveller' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={travellerData.name}
                                            onChange={(e) => setTravellerData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={travellerData.email}
                                            onChange={(e) => setTravellerData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={travellerData.phone}
                                            onChange={(e) => setTravellerData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                        <textarea
                                            value={travellerData.address}
                                            onChange={(e) => setTravellerData(prev => ({ ...prev, address: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Travel Preferences</label>
                                        <textarea
                                            value={travellerData.travelPreferences}
                                            onChange={(e) => setTravellerData(prev => ({ ...prev, travelPreferences: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Describe your travel preferences (e.g., budget, destinations, activities)"
                                        />
                                    </div>
                                </div>
                            )}

                            {user?.role === 'manager' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={ownerData.name}
                                            onChange={(e) => setOwnerData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={ownerData.email}
                                            onChange={(e) => setOwnerData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hotel Name</label>
                                        <input
                                            type="text"
                                            value={ownerData.hotelName}
                                            onChange={(e) => setOwnerData(prev => ({ ...prev, hotelName: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your hotel name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={ownerData.phone}
                                            onChange={(e) => setOwnerData(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hotel Address</label>
                                        <textarea
                                            value={ownerData.hotelAddress}
                                            onChange={(e) => setOwnerData(prev => ({ ...prev, hotelAddress: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your hotel address"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Hotel Documents</label>
                                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Upload hotel registration, licenses, or other documents</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => handleFileChange(e, 'documents')}
                                                className="hidden"
                                                id="document-upload"
                                            />
                                            <label
                                                htmlFor="document-upload"
                                                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer"
                                            >
                                                Choose Files
                                            </label>
                                        </div>
                                        {ownerData.documents.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {ownerData.documents.map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {typeof doc === 'string' ? doc.split('/').pop() : doc.name}
                                                        </span>
                                                        <button
                                                            onClick={() => setOwnerData(prev => ({
                                                                ...prev,
                                                                documents: prev.documents.filter((_, i) => i !== index)
                                                            }))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {user?.role === 'admin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={adminData.name}
                                            onChange={(e) => setAdminData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={adminData.email}
                                            onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                                        <input
                                            type="text"
                                            value={adminData.role}
                                            readOnly
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Access Settings</label>
                                        <div className="space-y-2">
                                            {['User Management', 'Content Moderation', 'Analytics', 'System Configuration'].map(access => (
                                                <label key={access} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={adminData.systemAccess.includes(access)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setAdminData(prev => ({
                                                                    ...prev,
                                                                    systemAccess: [...prev.systemAccess, access]
                                                                }));
                                                            } else {
                                                                setAdminData(prev => ({
                                                                    ...prev,
                                                                    systemAccess: prev.systemAccess.filter(a => a !== access)
                                                                }));
                                                            }
                                                        }}
                                                        className="mr-2"
                                                    />
                                                    {access}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="p-6 space-y-6">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Password Security</h3>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                            Your password should be at least 8 characters long and include a mix of letters, numbers, and symbols.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={
                                                user?.role === 'traveller' ? travellerData.currentPassword :
                                                user?.role === 'manager' ? ownerData.currentPassword :
                                                adminData.currentPassword
                                            }
                                            onChange={(e) => {
                                                if (user?.role === 'traveller') {
                                                    setTravellerData(prev => ({ ...prev, currentPassword: e.target.value }));
                                                } else if (user?.role === 'manager') {
                                                    setOwnerData(prev => ({ ...prev, currentPassword: e.target.value }));
                                                } else {
                                                    setAdminData(prev => ({ ...prev, currentPassword: e.target.value }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={
                                            user?.role === 'traveller' ? travellerData.newPassword :
                                            user?.role === 'manager' ? ownerData.newPassword :
                                            adminData.newPassword
                                        }
                                        onChange={(e) => {
                                            if (user?.role === 'traveller') {
                                                setTravellerData(prev => ({ ...prev, newPassword: e.target.value }));
                                            } else if (user?.role === 'manager') {
                                                setOwnerData(prev => ({ ...prev, newPassword: e.target.value }));
                                            } else {
                                                setAdminData(prev => ({ ...prev, newPassword: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={
                                            user?.role === 'traveller' ? travellerData.confirmPassword :
                                            user?.role === 'manager' ? ownerData.confirmPassword :
                                            adminData.confirmPassword
                                        }
                                        onChange={(e) => {
                                            if (user?.role === 'traveller') {
                                                setTravellerData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                            } else if (user?.role === 'manager') {
                                                setOwnerData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                            } else {
                                                setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
