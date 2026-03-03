import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const AdminStaffs = () => {
  const [staffs, setStaffs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadStaffs = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/api/admin/staffs');
        if (!isMounted) return;
        setStaffs(data?.staffs || []);
      } catch (err) {
        if (!isMounted) return;
        const message = err?.response?.data?.error || 'Failed to load staffs';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStaffs();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredStaffs = useMemo(() => {
    return staffs
      .filter((staff) => {
        if (!normalizedSearchQuery) return true;
        const username = (staff.username || '').toLowerCase();
        const email = (staff.email || '').toLowerCase();
        return username.includes(normalizedSearchQuery) || email.includes(normalizedSearchQuery);
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [staffs, normalizedSearchQuery]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB');
  };

  return (
    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Staffs
          </h2>
          <p className="text-xs text-gray-500">
            Platform staff accounts with admin operational access.
          </p>
        </div>
        <span className="text-[11px] text-gray-500">{filteredStaffs.length} staffs</span>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search staffs by name or email"
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
            <tr className="text-left">
              <th className="px-4 py-2 font-semibold">Staff</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold">Joined</th>
              <th className="px-4 py-2 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">
                  Loading staffs...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-red-500">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && filteredStaffs.map((staff) => (
              <tr key={staff._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                <td className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {staff.username || '—'}
                    </span>
                    <span className="text-[11px] text-gray-500">{staff.email || '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200 capitalize">
                  {staff.role || 'staff'}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {formatDate(staff.createdAt)}
                </td>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                  {formatDate(staff.updatedAt)}
                </td>
              </tr>
            ))}

            {!loading && !error && filteredStaffs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-500">
                  {normalizedSearchQuery ? 'No staffs match this search.' : 'No staffs found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminStaffs;
