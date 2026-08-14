"use client";
import React from "react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
  );
}

export function SkeletonCard({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 space-y-3 ${className}`}>
      <SkeletonBlock className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${className}`}>
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <SkeletonBlock className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="px-5 py-3 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <SkeletonBlock
                key={col}
                className={`h-4 ${col === 0 ? "w-1/4" : col === cols - 1 ? "w-1/6" : "w-1/5"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPI({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <SkeletonBlock className="h-3 w-1/2" />
          <SkeletonBlock className="h-7 w-2/3" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      <SkeletonBlock className="h-8 w-1/3" />
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonKPI count={4} />
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

export default SkeletonPage;
