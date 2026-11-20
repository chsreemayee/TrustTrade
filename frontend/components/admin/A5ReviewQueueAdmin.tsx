"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { ReviewItem, MOCK_REVIEWS } from "../../mocks/admin";
import { api } from "../../lib/api";

export const A5ReviewQueueAdmin: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>(MOCK_REVIEWS);

  useEffect(() => {
    api.getReviewQueue().then(setReviews);
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: "approved" | "dismissed") => {
    const updated = await api.updateReviewStatus(id, newStatus);
    setReviews(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-bold text-charcoal">Learner Reports & Flagged Verdicts</h2>
        <p className="text-[15px] text-charcoal-secondary">
          Review suspicious tips submitted by learners. Approved items are converted to fraud rules or practice drills.
        </p>
      </div>

      {/* Review Queue Cards */}
      <div className="flex flex-col gap-3">
        {reviews.map((item) => {
          const isOpen = item.status === "open";
          const isApproved = item.status === "approved";

          return (
            <div
              key={item.id}
              className={`p-5 rounded-card border shadow-card transition-all flex flex-col gap-3 ${
                isOpen
                  ? "bg-white border-border"
                  : isApproved
                  ? "bg-teal-light/30 border-teal-deep/30 opacity-80"
                  : "bg-cream-dark/40 border-border opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold px-2.5 py-0.5 rounded bg-cream border border-border text-charcoal">
                    {item.check_id}
                  </span>
                  <span className="text-[13px] text-charcoal-secondary flex items-center gap-1">
                    <Clock size={14} />
                    <span>{item.timestamp}</span>
                  </span>
                </div>

                <span
                  className={`px-3 py-0.5 rounded-full text-[13px] font-bold ${
                    isOpen
                      ? "bg-amber-100 text-amber-800"
                      : isApproved
                      ? "bg-verdict-no_signs-bg text-verdict-no_signs-text"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>

              {/* Reported Text (Notice: PRD rule - No phone numbers shown!) */}
              <div className="p-3 bg-cream/40 rounded-xl border border-border">
                <span className="text-[12px] font-bold text-charcoal-secondary uppercase block mb-1">
                  Reported Message Text (Personal IDs Redacted)
                </span>
                <p className="text-[16px] text-charcoal font-medium italic">
                  "{item.reported_text}"
                </p>
              </div>

              {/* Reason */}
              <div className="text-[14px] text-charcoal-secondary">
                <span className="font-bold text-charcoal">User Reason: </span>
                <span>{item.reason}</span>
              </div>

              {/* Actions */}
              {isOpen && (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-1">
                  <button
                    onClick={() => handleStatusUpdate(item.id, "dismissed")}
                    className="px-4 py-2 rounded-btn bg-cream-dark hover:bg-border text-charcoal font-semibold text-[14px] flex items-center gap-1.5"
                  >
                    <XCircle size={18} />
                    <span>Dismiss</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(item.id, "approved")}
                    className="px-5 py-2 rounded-btn bg-teal-deep hover:bg-teal-hover text-white font-bold text-[14px] flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={18} />
                    <span>Approve (Add to Rules / Drills)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
