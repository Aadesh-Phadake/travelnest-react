import React from 'react';
import { Skeleton } from './SkeletonBase';

export const ListingDetailSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fadeIn">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-9 w-3/4 max-w-md rounded-lg" />
                    <div className="flex flex-wrap items-center gap-3">
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>

                {/* Weather Widget Skeleton */}
                <div className="flex-shrink-0 w-full md:w-auto">
                    <Skeleton className="h-14 w-44 rounded-xl" />
                </div>
            </div>

            {/* Restored Image Grid Skeleton (1 large + 4 small) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden h-[400px] md:h-[500px] mb-10 shadow-md">
                <Skeleton className="w-full h-full rounded-none" />
                <div className="hidden md:grid grid-cols-2 gap-2 h-full">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="w-full h-full rounded-none" />
                    ))}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column (2 cols) */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Host Info */}
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-8">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-56 rounded-md" />
                            <Skeleton className="h-4 w-40 rounded-md" />
                        </div>
                        <Skeleton className="h-14 w-14 rounded-full" />
                    </div>

                    {/* About Section */}
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-36 rounded-md mb-2" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-11/12 rounded" />
                        <Skeleton className="h-4 w-4/5 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                    </div>

                    {/* Map Skeleton */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-10 space-y-4">
                        <Skeleton className="h-6 w-44 rounded-md" />
                        <Skeleton className="w-full h-[400px] rounded-2xl" />
                    </div>

                    {/* Reviews Skeleton */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-10 space-y-6">
                        <Skeleton className="h-7 w-48 rounded-md" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-6 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-3 w-16 rounded" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-3 w-28 rounded" />
                                    <Skeleton className="h-3 w-full rounded" />
                                    <Skeleton className="h-3 w-4/5 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sticky Booking Card Skeleton */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 lg:p-8 space-y-6">
                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                            <Skeleton className="h-8 w-28 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded" />
                        </div>

                        {/* Date Picker Skeleton Box */}
                        <div className="grid grid-cols-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden h-16">
                            <div className="p-3 border-r border-gray-200 dark:border-gray-700 space-y-1">
                                <Skeleton className="h-2.5 w-14 rounded" />
                                <Skeleton className="h-4 w-20 rounded" />
                            </div>
                            <div className="p-3 space-y-1">
                                <Skeleton className="h-2.5 w-14 rounded" />
                                <Skeleton className="h-4 w-20 rounded" />
                            </div>
                        </div>

                        {/* Guests Box */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 h-14 space-y-1">
                            <Skeleton className="h-2.5 w-12 rounded" />
                            <Skeleton className="h-4 w-20 rounded" />
                        </div>

                        {/* Button */}
                        <Skeleton className="w-full h-12 rounded-xl" />

                        {/* Guarantee footnote */}
                        <div className="flex justify-between pt-2">
                            <Skeleton className="h-3 w-28 rounded" />
                            <Skeleton className="h-3 w-24 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailSkeleton;
