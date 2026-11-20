"use client";

import React, { useState } from "react";
import { Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { TrustButton } from "../TrustButton";

interface A1AdminLoginProps {
  onLoginSuccess: () => void;
}

export const A1AdminLogin: React.FC<A1AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("admin@trusttrade.org");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    // Accept seeded demo credentials
    if (email.trim() && password.length >= 4) {
      setError(null);
      onLoginSuccess();
    } else {
      setError("Invalid credentials. Try admin@trusttrade.org / admin123");
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-card p-8 border border-border shadow-card flex flex-col gap-5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-teal-deep text-marigold flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldCheck size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-title text-charcoal">TrustTrade Admin</h2>
          <p className="text-body text-charcoal-secondary mt-1">
            Content Administration & Moderation Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-bold text-charcoal mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-cream/40 rounded-xl border border-border focus-within:border-teal-deep">
              <Mail size={20} className="text-teal-deep" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trusttrade.org"
                className="w-full bg-transparent text-[16px] text-charcoal focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-bold text-charcoal mb-1">
              Password
            </label>
            <div className="flex items-center gap-2 p-3 bg-cream/40 rounded-xl border border-border focus-within:border-teal-deep">
              <Lock size={20} className="text-teal-deep" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-[16px] text-charcoal focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-verdict-scam-bg text-verdict-scam-text text-[14px] font-semibold text-center">
              {error}
            </div>
          )}

          <div className="p-3 bg-teal-light/40 border border-teal-deep/20 rounded-xl text-[13px] text-charcoal-secondary">
            <span className="font-bold text-teal-deep">Demo Account Seeded:</span>
            <div className="mt-0.5">Email: admin@trusttrade.org</div>
            <div>Password: admin123</div>
          </div>

          <TrustButton
            type="submit"
            variant="primary"
            label="Log In to Dashboard"
            icon={<ArrowRight size={22} />}
            onClick={() => {}}
          />
        </form>
      </div>
    </div>
  );
};
