import React from "react";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardGrid({
  children,
  className = "",
}: DashboardGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {children}
    </div>
  );
}

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export function DashboardCard({
  children,
  className = "",
  title,
  actions,
}: DashboardCardProps) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          )}
          {actions && (
            <div className="flex items-center space-x-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
