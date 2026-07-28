// src/pages/Dashboard/components/DashboardSkeleton/DashboardSkeleton.tsx

import "./DashboardSkeleton.scss";

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-busy="true" aria-label="대시보드 불러오는 중">
      <div className="sk sk--banner" />

      <div className="sk sk--stat-card" />

      <div className="sk sk--podium" />

      <div className="sk-section">
        <div className="sk sk--section-title" />
        <div className="sk-gatherings-grid">
          <div className="sk sk--gathering-card" />
          <div className="sk sk--gathering-card" />
          <div className="sk sk--gathering-card" />
        </div>
      </div>

      <div className="sk-member-grid">
        <div className="sk sk--member-card" />
        <div className="sk sk--member-card" />
        <div className="sk sk--member-card" />
        <div className="sk sk--member-card" />
      </div>
    </div>
  );
}
