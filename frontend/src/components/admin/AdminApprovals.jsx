import React from 'react';
import { useAdminApprovals } from '../../hooks/admin/useAdminApprovals';

const AdminApprovals = () => {
  const {
    pendingManagers,
    pendingHotels,
    approveMgr,
    rejectMgr,
    approveHtl,
    rejectHtl,
  } = useAdminApprovals();

  const handleApproveManager = (id) => {
    approveMgr(id);
  };

  const handleRejectManager = (id) => {
    if (window.confirm('Reject this manager request?')) {
      rejectMgr(id);
    }
  };

  const handleApproveHotel = (id) => {
    approveHtl(id);
  };

  const handleRejectHotel = (id) => {
    if (window.confirm('Reject this hotel listing?')) {
      rejectHtl(id);
    }
  };

  return (
    <section className="space-y-6">
      {/* Pending Manager Approvals */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Pending Manager Approvals
            </h2>
            <p className="text-xs text-gray-500">
              Approve hotel managers before they can list and manage properties.
            </p>
          </div>
          <span className="text-[11px] text-gray-500">
            {pendingManagers.length} pending
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-2 font-semibold">Manager</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Requested at</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pendingManagers.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {m.username}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    {m.email}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleDateString('en-GB')
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleApproveManager(m._id)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectManager(m._id)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingManagers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-xs text-gray-500"
                  >
                    No pending manager requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Hotel Approvals */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Pending Hotel Approvals
            </h2>
            <p className="text-xs text-gray-500">
              Review and approve hotel listings submitted by managers.
            </p>
          </div>
          <span className="text-[11px] text-gray-500">
            {pendingHotels.length} pending
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-2 font-semibold">Hotel</th>
                <th className="px-4 py-2 font-semibold">Location</th>
                <th className="px-4 py-2 font-semibold">Manager</th>
                <th className="px-4 py-2 font-semibold">Submitted at</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pendingHotels.map((h) => (
                <tr key={h._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                    {h.title}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    {h.location}, {h.country}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    {h.owner?.username || '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-GB')
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleApproveHotel(h._id)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectHotel(h._id)}
                        className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingHotels.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-xs text-gray-500"
                  >
                    No pending hotel approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminApprovals;
