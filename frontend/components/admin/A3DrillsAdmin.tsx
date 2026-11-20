"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Save,
  X,
} from "lucide-react";
import { ScamDrill, MOCK_DRILLS } from "../../mocks/drills";
import { SUPPORTED_LANGUAGES } from "../../lib/i18n";

export const A3DrillsAdmin: React.FC = () => {
  const [drills, setDrills] = useState<ScamDrill[]>(MOCK_DRILLS);
  const [editingDrill, setEditingDrill] = useState<ScamDrill | null>(null);
  const [activeLang, setActiveLang] = useState("en");

  const handleSave = () => {
    if (editingDrill) {
      if (!editingDrill.tricks || editingDrill.tricks.length === 0) {
        alert("Must set at least 1 trick according to PRD section 8 rules.");
        return;
      }
      setDrills((prev) =>
        prev.map((d) => (d.id === editingDrill.id ? editingDrill : d))
      );
      setEditingDrill(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-charcoal">Scam Drills Management</h2>
          <p className="text-[15px] text-charcoal-secondary">
            Manage practice drills to train learners in recognizing fraud vs legitimate messages
          </p>
        </div>

        <button
          onClick={() => {
            const newD: ScamDrill = {
              id: `drill-${Date.now()}`,
              type: "scam",
              sender_name: { en: "Investment Club", te: "ఇన్వెస్ట్‌మెంట్ క్లబ్" },
              message: { en: "Sample suspicious drill message", te: "నమూనా మోసపూరిత సందేశం" },
              correct_answer: "scam",
              tricks: [
                {
                  highlight: "Double money",
                  explanation: { en: "Fixed return promise is prohibited", te: "లాభాల హామీ మోసం" },
                },
              ],
              explanation: { en: "Detailed drill explanation", te: "వివరణ" },
            };
            setEditingDrill(newD);
          }}
          className="px-4 py-2.5 rounded-btn bg-teal-deep text-white font-bold flex items-center gap-2 hover:bg-teal-hover shadow-sm"
        >
          <Plus size={20} />
          <span>New Drill</span>
        </button>
      </div>

      {/* Drills Table */}
      <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-b border-border text-[14px] font-bold text-charcoal uppercase">
              <th className="py-3.5 px-4">Drill ID</th>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Sample Message</th>
              <th className="py-3.5 px-4">Tricks Configured</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[15px]">
            {drills.map((drill) => (
              <tr key={drill.id} className="hover:bg-cream/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-teal-deep">
                  {drill.id}
                </td>
                <td className="py-3.5 px-4 font-bold text-charcoal">
                  {drill.sender_name.en || drill.sender_name.te}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                      drill.correct_answer === "scam"
                        ? "bg-verdict-scam-bg text-verdict-scam-text"
                        : "bg-verdict-no_signs-bg text-verdict-no_signs-text"
                    }`}
                  >
                    {drill.correct_answer === "scam" ? (
                      <XCircle size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>{drill.correct_answer.toUpperCase()}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-charcoal-secondary max-w-xs truncate">
                  {drill.message.en || drill.message.te}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-charcoal">
                    {drill.tricks.length} trick(s)
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setEditingDrill(drill)}
                    className="p-2 rounded-lg text-teal-deep hover:bg-cream border border-border"
                  >
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drill Editor Modal */}
      {editingDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-heading text-charcoal font-bold">
                Edit Drill ({editingDrill.id})
              </h3>
              <button
                onClick={() => setEditingDrill(null)}
                className="p-1 text-charcoal-secondary hover:text-charcoal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Answer selector */}
            <div>
              <label className="block text-[14px] font-bold text-charcoal mb-1">
                Correct Answer
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditingDrill({ ...editingDrill, correct_answer: "scam" })
                  }
                  className={`p-3 rounded-xl border-2 font-bold text-[16px] flex items-center justify-center gap-2 ${
                    editingDrill.correct_answer === "scam"
                      ? "bg-verdict-scam-bg border-verdict-scam-border text-verdict-scam-text"
                      : "bg-white border-border text-charcoal"
                  }`}
                >
                  <XCircle size={20} />
                  <span>Scam</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingDrill({ ...editingDrill, correct_answer: "real" })
                  }
                  className={`p-3 rounded-xl border-2 font-bold text-[16px] flex items-center justify-center gap-2 ${
                    editingDrill.correct_answer === "real"
                      ? "bg-verdict-no_signs-bg border-verdict-no_signs-border text-verdict-no_signs-text"
                      : "bg-white border-border text-charcoal"
                  }`}
                >
                  <CheckCircle2 size={20} />
                  <span>Real</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1 border-b border-border pb-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setActiveLang(lang.code)}
                  className={`px-3 py-1.5 rounded-t-lg font-bold text-[13px] ${
                    activeLang === lang.code
                      ? "bg-teal-deep text-white"
                      : "bg-cream text-charcoal"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Message per language */}
            <div>
              <label className="block text-[14px] font-bold text-charcoal mb-1">
                Message Text ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={editingDrill.message[activeLang] || ""}
                onChange={(e) =>
                  setEditingDrill({
                    ...editingDrill,
                    message: {
                      ...editingDrill.message,
                      [activeLang]: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 rounded-xl border border-border text-[15px]"
              />
            </div>

            {/* Trick Config */}
            <div className="p-3 bg-cream/40 rounded-xl border border-border flex flex-col gap-2">
              <label className="text-[14px] font-bold text-charcoal">
                Highlighted Trick Span (Required)
              </label>
              <input
                type="text"
                value={editingDrill.tricks[0]?.highlight || ""}
                onChange={(e) => {
                  const updatedTricks = [...editingDrill.tricks];
                  if (!updatedTricks[0]) {
                    updatedTricks.push({ highlight: e.target.value, explanation: {} });
                  } else {
                    updatedTricks[0].highlight = e.target.value;
                  }
                  setEditingDrill({ ...editingDrill, tricks: updatedTricks });
                }}
                placeholder="Words to highlight in message"
                className="w-full p-2 rounded-lg border border-border bg-white text-[15px]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setEditingDrill(null)}
                className="px-5 py-2.5 rounded-btn bg-cream-dark text-charcoal font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-btn bg-teal-deep text-white font-bold flex items-center gap-2"
              >
                <Save size={18} />
                <span>Save Drill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
