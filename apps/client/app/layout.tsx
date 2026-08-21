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
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID?.slice(0, 7) || "local";

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com https://monopoly-server-smff.onrender.com wss://monopoly-server-smff.onrender.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none';" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon-192.png`} />
      </head>
      <body>
        {children}
        <footer className="fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-10">
          <a
            href="https://github.com/geea-develop/monopoly/issues/new?template=bug_report.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 text-xs underline"
          >
            Report Bug
          </a>
          <span className="text-gray-700 text-[10px]">
            build {buildId} 🎩
          </span>
        </footer>
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "136e08eeda5c4767885f149528781334"}'
        />
      </body>
    </html>
  );
}
