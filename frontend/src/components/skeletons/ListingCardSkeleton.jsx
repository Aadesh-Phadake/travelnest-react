import React from 'react';
import { Skeleton } from './SkeletonBase';

export const ListingCardSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            {/* Image Placeholder */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-700">
                <Skeleton className="w-full h-full rounded-none" />
                {/* Badge Skeleton */}
                <div className="absolute top-3 right-3">
                    <Skeleton className="w-14 h-5 rounded-md bg-white/70 dark:bg-gray-600" />
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Title & Rating */}
                <div className="flex justify-between items-start mb-2 gap-2">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-5 w-12 rounded" />
                </div>

                {/* Location */}
                <Skeleton className="h-4 w-1/2 rounded mb-3" />

                {/* Price & Fee */}
                <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                        <Skeleton className="h-5 w-16 rounded" />
                        <Skeleton className="h-3 w-10 rounded" />
                    </div>
                    <Skeleton className="h-4 w-14 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export const ListingGridSkeleton = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, index) => (
                <ListingCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default ListingCardSkeleton;
