"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { ScamRule, MOCK_SCAM_RULES } from "../../mocks/admin";
import { api } from "../../lib/api";

export const A4ScamRulesAdmin: React.FC = () => {
  const [rules, setRules] = useState<ScamRule[]>(MOCK_SCAM_RULES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRuleCode, setNewRuleCode] = useState("");
  const [newPattern, setNewPattern] = useState("");
  const [newWeight, setNewWeight] = useState<number>(2);
  const [isAlwaysScam, setIsAlwaysScam] = useState(false);

  useEffect(() => {
    api.getScamRules().then(setRules);
  }, []);

  const handleAddRule = async () => {
    if (!newRuleCode || !newPattern) {
      alert("Please provide code and pattern phrase.");
      return;
    }

    const updated = await api.addScamRule({
      code: newRuleCode.toUpperCase(),
      pattern: newPattern,
      languages: ["te", "hi", "en", "kn", "ta", "ml"],
      weight: newWeight,
      is_always_scam: isAlwaysScam,
      lesson_id: "scam_guaranteed_returns",
      active: true,
    });

    setRules(updated);
    setIsAddModalOpen(false);
    setNewRuleCode("");
    setNewPattern("");
    setIsAlwaysScam(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-bold text-charcoal">Scam Rules & Weights</h2>
          <p className="text-[15px] text-charcoal-secondary">
            Scored warning-sign table and instant red verdict "Always a Scam" triggers
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-btn bg-teal-deep text-white font-bold flex items-center gap-2 hover:bg-teal-hover shadow-sm"
        >
          <Plus size={20} />
          <span>Add Scam Rule</span>
        </button>
      </div>

      {/* "Always a scam" Section Banner (PRD Section 6.2 & 6.3) */}
      <div className="bg-verdict-scam-bg border border-verdict-scam-border rounded-card p-5 shadow-card">
        <div className="flex items-center gap-2 font-bold text-[17px] text-verdict-scam-text mb-2">
          <AlertTriangle size={22} />
          <span>"Always a Scam" Rules (Instant Red Verdict)</span>
        </div>
        <p className="text-[14px] text-charcoal leading-relaxed mb-3">
          Any match against these rules immediately gives a score $\ge 3$ and an instant Red "Looks like a scam" verdict:
        </p>
        <div className="grid grid-cols-2 gap-2 text-[14px] font-semibold text-charcoal">
          <div className="p-2.5 bg-white rounded-lg border border-verdict-scam-border">
            • Send money and get it doubled in X days
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-verdict-scam-border">
            • Pay a fee to receive money, lottery or profits
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-verdict-scam-border">
            • Enter your UPI PIN to receive money
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-verdict-scam-border">
            • Share an OTP to receive returns or bonus
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-b border-border text-[14px] font-bold text-charcoal uppercase">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Pattern / Phrases</th>
              <th className="py-3.5 px-4">Weight</th>
              <th className="py-3.5 px-4">Instant Red?</th>
              <th className="py-3.5 px-4">Languages</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[15px]">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-cream/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-teal-deep">
                  {rule.code}
                </td>
                <td className="py-3.5 px-4 font-medium text-charcoal max-w-sm truncate">
                  {rule.pattern}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[13px] font-bold ${
                      rule.weight >= 2
                        ? "bg-red-100 text-red-800"
                        : rule.weight === 1
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    Weight: {rule.weight}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                      rule.is_always_scam
                        ? "bg-verdict-scam-bg text-verdict-scam-text"
                        : "text-charcoal-secondary"
                    }`}
                  >
                    {rule.is_always_scam ? "YES (Instant Red)" : "No"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[13px] text-charcoal-secondary font-mono">
                  {rule.languages.join(", ")}
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-verdict-no_signs-text font-bold text-[13px]">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-card w-full max-w-md p-6 shadow-2xl border border-border flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-heading text-charcoal font-bold">
                Add New Scam Pattern Rule
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-charcoal-secondary hover:text-charcoal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[14px] font-bold text-charcoal mb-1">
                  Rule Code
                </label>
                <input
                  type="text"
                  value={newRuleCode}
                  onChange={(e) => setNewRuleCode(e.target.value)}
                  placeholder="e.g. FAKE_IPO_ALLOTMENT"
                  className="w-full p-2.5 rounded-xl border border-border font-mono text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-charcoal mb-1">
                  Pattern / Matching Phrases (regex or pipe separated)
                </label>
                <textarea
                  rows={3}
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  placeholder="e.g. 50% discount|pre-ipo allotment|personal account"
                  className="w-full p-2.5 rounded-xl border border-border text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-charcoal mb-1">
                  Weight
                </label>
                <select
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-border text-[15px]"
                >
                  <option value={2}>High (Weight 2) - Fixed returns, personal UPI, APK</option>
                  <option value={1}>Medium (Weight 1) - Urgency, VIP group, fees</option>
                  <option value={0.5}>Low (Weight 0.5) - Short link, unknown number</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="always_scam_check"
                  checked={isAlwaysScam}
                  onChange={(e) => setIsAlwaysScam(e.target.checked)}
                  className="w-5 h-5 rounded text-teal-deep focus:ring-teal-deep"
                />
                <label
                  htmlFor="always_scam_check"
                  className="text-[14px] font-bold text-charcoal cursor-pointer"
                >
                  Mark as "Always a Scam" (triggers immediate red verdict)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-btn bg-cream-dark text-charcoal font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                className="px-6 py-2.5 rounded-btn bg-teal-deep text-white font-bold flex items-center gap-2"
              >
                <Save size={18} />
                <span>Save Rule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
