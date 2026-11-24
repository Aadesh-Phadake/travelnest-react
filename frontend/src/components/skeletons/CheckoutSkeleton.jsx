import React from 'react';
import { Skeleton } from './SkeletonBase';

export const CheckoutSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            {/* Title */}
            <Skeleton className="h-9 w-60 rounded-lg mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT: Trip & Payment Details */}
                <div className="space-y-6">
                    {/* Your Trip Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <Skeleton className="h-6 w-32 rounded mb-2" />

                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-36 rounded" />
                            </div>
                            <Skeleton className="h-6 w-12 rounded" />
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16 rounded" />
                                <Skeleton className="h-4 w-24 rounded" />
                            </div>
                            <Skeleton className="h-6 w-12 rounded" />
                        </div>
                    </div>

                    {/* Payment Options Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                        <Skeleton className="h-6 w-40 rounded" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>

                    {/* Pay Button Skeleton */}
                    <Skeleton className="w-full h-14 rounded-xl" />
                </div>

                {/* RIGHT: Order Summary Card */}
                <div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg sticky top-28 space-y-6">
                        {/* Hotel Info Header */}
                        <div className="flex gap-4 items-center pb-6 border-b border-gray-100 dark:border-gray-700">
                            <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="h-5 w-4/5 rounded" />
                                <Skeleton className="h-4 w-28 rounded" />
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-3 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <Skeleton className="h-5 w-32 rounded mb-2" />
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-36 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-28 rounded" />
                                <Skeleton className="h-4 w-16 rounded" />
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-baseline pt-2">
                            <Skeleton className="h-6 w-28 rounded" />
                            <Skeleton className="h-8 w-24 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSkeleton;
