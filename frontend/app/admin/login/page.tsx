"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Wrong email or password.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8F9FA",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "#F2A900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🛡️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F5C5C" }}>
              TrustTrade
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#52606D" }}>Admin Portal</p>
          </div>
        </div>

        <h2
          style={{ fontSize: "18px", fontWeight: 600, color: "#1F2933", marginBottom: "24px", marginTop: "16px" }}
        >
          Sign in to continue
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "#1F2933", marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1.5px solid #E5E1D8",
              fontSize: "16px",
              marginBottom: "16px",
              outline: "none",
              boxSizing: "border-box",
              color: "#1F2933",
            }}
          />

          <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "#1F2933", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1.5px solid #E5E1D8",
              fontSize: "16px",
              marginBottom: "24px",
              outline: "none",
              boxSizing: "border-box",
              color: "#1F2933",
            }}
          />

          {error && (
            <div
              style={{
                background: "#FDECEA",
                color: "#B42318",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "16px",
              border: "none",
              background: loading ? "#52606D" : "#0F5C5C",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
