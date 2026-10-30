import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themeInitScript } from "@/components/theme-provider";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Discover and book events`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Evently is an event booking and ticketing platform: discover events, book with a mock payment flow, and get QR-coded tickets.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
