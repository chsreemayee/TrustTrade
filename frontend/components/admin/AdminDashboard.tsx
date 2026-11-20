"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Target,
  ShieldAlert,
  Inbox,
  Database,
  LogOut,
  Smartphone,
  TrendingUp,
  Users,
  ShieldCheck,
  Search,
} from "lucide-react";
import { A1AdminLogin } from "./A1AdminLogin";
import { A2LessonsAdmin } from "./A2LessonsAdmin";
import { A3DrillsAdmin } from "./A3DrillsAdmin";
import { A4ScamRulesAdmin } from "./A4ScamRulesAdmin";
import { A5ReviewQueueAdmin } from "./A5ReviewQueueAdmin";
import { A6DataAlertsAdmin } from "./A6DataAlertsAdmin";
import { MOCK_ADMIN_STATS } from "../../mocks/admin";

interface AdminDashboardProps {
  onSwitchToLearner: () => void;
}

export type AdminTab = "lessons" | "drills" | "rules" | "reviews" | "data";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSwitchToLearner,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("rules");

  if (!isAuthenticated) {
    return (
      <A1AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
    );
  }

  const stats = MOCK_ADMIN_STATS;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-deep text-marigold flex items-center justify-center font-bold">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-charcoal tracking-tight">
              TrustTrade Administration
            </h1>
            <p className="text-[14px] text-charcoal-secondary">
              Managing content, scam heuristics, SEBI registry, and learner safety
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToLearner}
            className="flex items-center gap-2 px-4 py-2 rounded-btn bg-marigold text-charcoal font-bold text-[14px] hover:bg-marigold-hover shadow-sm"
          >
            <Smartphone size={18} />
            <span>Open Learner App (360x800)</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2 rounded-btn bg-cream-dark text-charcoal-secondary hover:text-loss border border-border"
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-card border border-border shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-light text-teal-deep flex items-center justify-center">
            <Search size={24} />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-charcoal-secondary block">
              Total Scam Checks
            </span>
            <span className="text-[24px] font-bold text-charcoal font-mono">
              {stats.total_checks.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-border shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-verdict-scam-bg text-verdict-scam-text flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-charcoal-secondary block">
              Scams Blocked
            </span>
            <span className="text-[24px] font-bold text-verdict-scam-text font-mono">
              {stats.scams_caught.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-border shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-charcoal-secondary block">
              Active Learners
            </span>
            <span className="text-[24px] font-bold text-charcoal font-mono">
              {stats.active_learners.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-border shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-verdict-no_signs-bg text-verdict-no_signs-text flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-charcoal-secondary block">
              SEBI Registry
            </span>
            <span className="text-[24px] font-bold text-charcoal font-mono">
              {stats.sebi_records_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (A2 - A6) */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("lessons")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[15px] border-b-2 transition-all ${
            activeTab === "lessons"
              ? "border-teal-deep text-teal-deep bg-white shadow-sm"
              : "border-transparent text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <BookOpen size={18} />
          <span>A2 Lessons</span>
        </button>

        <button
          onClick={() => setActiveTab("drills")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[15px] border-b-2 transition-all ${
            activeTab === "drills"
              ? "border-teal-deep text-teal-deep bg-white shadow-sm"
              : "border-transparent text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Target size={18} />
          <span>A3 Drills</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[15px] border-b-2 transition-all ${
            activeTab === "rules"
              ? "border-teal-deep text-teal-deep bg-white shadow-sm"
              : "border-transparent text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <ShieldAlert size={18} />
          <span>A4 Scam Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[15px] border-b-2 transition-all ${
            activeTab === "reviews"
              ? "border-teal-deep text-teal-deep bg-white shadow-sm"
              : "border-transparent text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Inbox size={18} />
          <span>A5 Review Queue</span>
        </button>

        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-[15px] border-b-2 transition-all ${
            activeTab === "data"
              ? "border-teal-deep text-teal-deep bg-white shadow-sm"
              : "border-transparent text-charcoal-secondary hover:text-charcoal"
          }`}
        >
          <Database size={18} />
          <span>A6 Data & Alerts</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="pb-12">
        {activeTab === "lessons" && <A2LessonsAdmin />}
        {activeTab === "drills" && <A3DrillsAdmin />}
        {activeTab === "rules" && <A4ScamRulesAdmin />}
        {activeTab === "reviews" && <A5ReviewQueueAdmin />}
        {activeTab === "data" && <A6DataAlertsAdmin />}
      </div>
    </div>
  );
};
