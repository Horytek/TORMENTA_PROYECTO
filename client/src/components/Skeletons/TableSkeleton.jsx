import React from 'react';
import { Card, Skeleton } from "@heroui/react";

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="w-full space-y-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                <Skeleton className="w-1/3 h-10 rounded-lg" />
                <Skeleton className="w-1/4 h-10 rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <Card className="w-full p-4 space-y-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm" radius="lg">
                {/* Table Header mock */}
                <div className="flex gap-4 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    {Array(columns).fill(0).map((_, i) => (
                        <Skeleton key={i} className="w-1/4 h-6 rounded-lg" />
                    ))}
                </div>

                {/* Rows */}
                {Array(rows).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        {/* Avatar/Icon column */}
                        <div className="w-12">
                            <Skeleton className="flex rounded-full w-10 h-10" />
                        </div>
                        {/* Data columns */}
                        <div className="w-full flex-1 flex flex-col gap-2">
                            <Skeleton className="h-3 w-4/5 rounded-lg" />
                            <Skeleton className="h-3 w-3/5 rounded-lg" />
                        </div>
                        {/* Action/Status column */}
                        <div className="w-24">
                            <Skeleton className="h-8 w-full rounded-lg" />
                        </div>
                    </div>
                ))}
            </Card>

            {/* Pagination Skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="w-32 h-8 rounded-lg" />
                <Skeleton className="w-64 h-8 rounded-lg" />
            </div>
        </div>
    );
};

export default TableSkeleton;
