import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Import Sub-components
import DashboardOverview from '../components/admin/DashboardOverview';
import UsersTable from '../components/admin/UsersTable';
import HotelsTable from '../components/admin/HotelsTable';
import OwnersTable from '../components/admin/OwnersTable';
import PendingApprovals from '../components/admin/PendingApprovals';
import ContactMessages from '../components/admin/ContactMessages';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview'); // overview | users | hotels | owners | approvals | messages

  const isAdmin = user && (user.role === 'admin' || user.username === 'TravelNest');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      return;
    }
  }, [user, isAdmin, navigate]);

  if (!user) return null;

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
            You must be logged in as an admin to view this dashboard.
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-xs text-gray-600 dark:text-gray-200 flex flex-col">
              <span className="font-semibold">{user?.username}</span>
              <span className="text-[11px] text-gray-500">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-4 text-sm font-medium overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'hotels', label: 'Hotels' },
            { id: 'owners', label: 'Managers' },
            { id: 'approvals', label: 'Approvals' },
            { id: 'messages', label: 'Messages' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 px-1 -mb-px border-b-2 transition capitalize whitespace-nowrap ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {tab === 'overview' && <DashboardOverview setTab={setTab} />}
          {tab === 'users' && <UsersTable />}
          {tab === 'hotels' && <HotelsTable />}
          {tab === 'owners' && <OwnersTable />}
          {tab === 'approvals' && <PendingApprovals />}
          {tab === 'messages' && <ContactMessages />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
