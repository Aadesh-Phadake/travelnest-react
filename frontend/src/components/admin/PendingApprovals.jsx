import React from 'react';
import { useAdminApprovals } from '../../hooks/admin/useAdminApprovals';
import {
  Check,
  X,
  UserPlus,
  Building,
  MapPin,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingApprovals = () => {
  const { 
    pendingManagers, 
    pendingHotels, 
    confirmApproveManager, 
    confirmRejectManager, 
    confirmApproveHotel, 
    confirmRejectHotel 
  } = useAdminApprovals();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Pending Managers Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Manager Requests</h2>
            <p className="text-sm text-gray-500">Users requesting to become hotel managers</p>
          </div>
          <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
            {pendingManagers.length} pending
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingManagers.length > 0 ? (
            pendingManagers.map((manager) => (
              <div key={manager._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                      {manager.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{manager.username}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {manager.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => confirmApproveManager(manager._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => confirmRejectManager(manager._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              No pending manager requests
            </div>
          )}
        </div>
      </section>

      {/* Pending Hotels Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Hotel Approvals</h2>
            <p className="text-sm text-gray-500">New property listings waiting for review</p>
          </div>
          <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
            {pendingHotels.length} pending
          </span>
        </div>

        <div className="space-y-4">
          {pendingHotels.length > 0 ? (
            pendingHotels.map((hotel) => (
              <div key={hotel._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                <img 
                  src={hotel.image?.url || 'https://via.placeholder.com/150'} 
                  alt={hotel.title}
                  className="w-full sm:w-48 h-32 object-cover rounded-xl bg-gray-100"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{hotel.title}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full dark:bg-amber-900/30 dark:text-amber-300">
                        Pending Review
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {hotel.location}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                      {hotel.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-semibold">₹{hotel.price?.toLocaleString('en-IN')} <span className="font-normal text-gray-500">/ night</span></span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">By {hotel.owner?.username || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Link 
                      to={`/listings/${hotel._id}`} 
                      target="_blank"
                      className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> View Details
                    </Link>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => confirmRejectHotel(hotel._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => confirmApproveHotel(hotel._id)}
                      className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-none rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Approve Listing
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              No pending hotel approvals
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PendingApprovals;
