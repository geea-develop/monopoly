import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monopoly — Multiplayer",
  description: "Free multiplayer Monopoly game — no sign-up required",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Monopoly",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com https://monopoly-server.onrender.com wss://monopoly-server.onrender.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none';" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon-192.png`} />
      </head>
      <body>
        {children}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "136e08eeda5c4767885f149528781334"}'
        />
      </body>
    </html>
  );
}
