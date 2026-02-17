import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminDashboard } from '../hooks/admin/useAdminDashboard';

import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminHotels from '../components/admin/AdminHotels';
import AdminOwners from '../components/admin/AdminOwners';
import AdminApprovals from '../components/admin/AdminApprovals';
import AdminMessages from '../components/admin/AdminMessages';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { loading, actionLoading, loadDashboard } = useAdminDashboard();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview'); // overview | users | hotels | approvals | owners | messages

  const isAdmin = user && (user.role === 'admin' || user.username === 'TravelNest');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      return;
    }

    // Initial fetch with default periods
    loadDashboard({ revenuePeriod: 'month', bookingsPeriod: 'month' });
  }, [user, isAdmin, loadDashboard, navigate]);

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Admin access only
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You must be logged in as an admin (or TravelNest master account) to view this
            dashboard.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-1">
              Super Admin
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50">
              Control Center
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Monitor users, properties and global performance of TravelNest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {actionLoading && (
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Applying changes...
              </span>
            )}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-600 dark:text-gray-200 flex flex-col">
              <span className="font-semibold">{user?.username}</span>
              <span className="text-[11px] text-gray-500">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setTab('overview')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('hotels')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'hotels'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Hotels
          </button>
          <button
            onClick={() => setTab('owners')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'owners'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Owners
          </button>
          <button
            onClick={() => setTab('approvals')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'approvals'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Approvals
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`pb-3 px-1 -mb-px border-b-2 transition whitespace-nowrap ${
              tab === 'messages'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Messages
          </button>
        </div>

        {tab === 'overview' && <AdminOverview setTab={setTab} />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'hotels' && <AdminHotels />}
        {tab === 'owners' && <AdminOwners />}
        {tab === 'approvals' && <AdminApprovals />}
        {tab === 'messages' && <AdminMessages />}
      </div>
    </div>
  );
};

export default AdminDashboard;