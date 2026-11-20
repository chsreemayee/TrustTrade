import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Admin layout: no <html>/<body> here — root layout handles those.
// The noindex is injected via metadata above (Next.js merges it into <head>).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
