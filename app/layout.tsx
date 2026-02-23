import type { Metadata } from "next";
import "./globals.css";

import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CipherChat — Real-Time Messaging",
  description:
    "Connect with your team and friends instantly with CipherChat. Real-time messaging powered by Convex with live presence and secure authentication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster position="bottom-center" richColors theme="dark" />
      </body>
    </html>
  );
}
