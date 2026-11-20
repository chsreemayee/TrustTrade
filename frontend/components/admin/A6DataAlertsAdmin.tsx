"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle,
  Database,
} from "lucide-react";
import { MOCK_ALERTS } from "../../mocks/alerts";
import { MOCK_ADMIN_STATS } from "../../mocks/admin";
import { SUPPORTED_LANGUAGES } from "../../lib/i18n";

export const A6DataAlertsAdmin: React.FC = () => {
  const [stats, setStats] = useState(MOCK_ADMIN_STATS);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [uploadedCsvSuccess, setUploadedCsvSuccess] = useState<string | null>(null);

  // New alert form
  const [alertTitle, setAlertTitle] = useState("");
  const [alertBody, setAlertBody] = useState("");
  const [alertLang, setAlertLang] = useState("te");

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStats((prev) => ({
        ...prev,
        sebi_records_count: prev.sebi_records_count + 140,
        sebi_last_refresh: "Just now (Manual CSV)",
      }));
      setUploadedCsvSuccess(
        `Successfully loaded ${file.name}. Updated 14,960 SEBI registered entities.`
      );
      setTimeout(() => setUploadedCsvSuccess(null), 4000);
    }
  };

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Date,Total_Checks,Scams_Caught,Careful_Verdicts,No_Signs_Verdicts,Lessons_Completed,Drills_Played,Trades_Made,User_Flags\n" +
      "2026-11-20,184,132,32,20,95,310,48,12\n" +
      "2026-11-19,210,145,41,24,112,280,56,8\n" +
      "2026-11-18,175,120,35,20,88,245,42,10\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trusttrade_usage_metrics_no_pii.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-bold text-charcoal">Official Data & Safety Alerts</h2>
        <p className="text-[15px] text-charcoal-secondary">
          Manage official SEBI registered intermediaries data, broadcast localized emergency warnings, and export aggregate usage.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Card 1: SEBI Registry CSV Upload */}
        <div className="bg-white rounded-card p-6 border border-border shadow-card flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Database size={24} className="text-teal-deep" />
            <h3 className="text-heading text-charcoal">
              SEBI Intermediaries Registry
            </h3>
          </div>

          <div className="flex flex-col gap-1 text-[15px]">
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Active Entities:</span>
              <span className="font-bold text-teal-deep font-mono">
                {stats.sebi_records_count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-secondary">Last Refresh:</span>
              <span className="font-bold text-charcoal">{stats.sebi_last_refresh}</span>
            </div>
            <div className="text-[13px] text-charcoal-secondary mt-1">
              Note: Daily automated API refresh is scheduled for Phase 2.
            </div>
          </div>

          <label className="cursor-pointer border-2 border-dashed border-teal-deep/40 hover:border-teal-deep rounded-2xl p-6 text-center flex flex-col items-center justify-center bg-cream/30 hover:bg-cream/60 transition-colors">
            <UploadCloud size={36} className="text-teal-deep mb-2" />
            <span className="font-bold text-[16px] text-charcoal">
              Upload SEBI List CSV
            </span>
            <span className="text-[13px] text-charcoal-secondary mt-0.5">
              Updates broker and depository participant database
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>

          {uploadedCsvSuccess && (
            <div className="p-3 bg-teal-light text-teal-deep rounded-xl text-[14px] font-bold text-center">
              {uploadedCsvSuccess}
            </div>
          )}
        </div>

        {/* Card 2: Aggregate Usage Reports (No PII) */}
        <div className="bg-white rounded-card p-6 border border-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-3">
              <FileSpreadsheet size={24} className="text-teal-deep" />
              <h3 className="text-heading text-charcoal">
                Usage Analytics Export (No PII)
              </h3>
            </div>

            <p className="text-[14px] text-charcoal-secondary leading-relaxed mb-4">
              Export daily aggregated activity logs: total checks, verdict breakdown (scam / careful / no signs), lessons finished, drills attempted, and user scam reports. Fully compliant with DPDP Act 2023 with zero personal identifiers.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="w-full py-3 rounded-btn bg-teal-deep hover:bg-teal-hover text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
          >
            <Download size={20} />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* Safety Alerts Management Section */}
      <div className="bg-white rounded-card p-6 border border-border shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} className="text-marigold" />
            <h3 className="text-heading text-charcoal">
              Home Safety Alerts per Language
            </h3>
          </div>
          <span className="text-[13px] px-3 py-1 rounded-full bg-verdict-no_signs-bg text-verdict-no_signs-text font-bold">
            1 Active Alert
          </span>
        </div>

        {/* Existing active alert preview */}
        <div className="p-4 bg-verdict-careful-bg border border-verdict-careful-border rounded-xl">
          <div className="flex items-center justify-between text-[13px] font-bold text-charcoal-secondary mb-1">
            <span>Current broadcast on Home screen (all 6 languages)</span>
            <span>Validity: 20 Nov 2026 – 30 Nov 2026</span>
          </div>
          <h4 className="font-bold text-[18px] text-charcoal">
            {alerts[0]?.title.te} / {alerts[0]?.title.en}
          </h4>
          <p className="text-[15px] text-charcoal mt-1">
            {alerts[0]?.body.te}
          </p>
        </div>
      </div>
    </div>
  );
};
