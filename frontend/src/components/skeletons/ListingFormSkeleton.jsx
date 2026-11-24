import React from 'react';
import { Skeleton } from './SkeletonBase';

export const ListingFormSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back button skeleton */}
                <Skeleton className="h-6 w-20 rounded" />

                {/* Form card skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary/10 px-8 py-6 border-b border-primary/20 space-y-2">
                        <Skeleton className="h-8 w-44 rounded-md" />
                        <Skeleton className="h-4 w-72 rounded" />
                    </div>

                    {/* Form body */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-11 w-full rounded-lg" />
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-28 w-full rounded-lg" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-11 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 rounded" />
                                <Skeleton className="h-11 w-full rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-36 rounded" />
                            <Skeleton className="h-11 w-full rounded-lg" />
                        </div>

                        <Skeleton className="h-12 w-full rounded-lg mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingFormSkeleton;
