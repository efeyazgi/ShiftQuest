import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/config/brand";
import { SettingsEffects } from "@/components/layout/settings-effects";
import { CloudSyncProvider } from "@/features/sync/cloud-sync-provider";

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.subtitle}`, template: `%s | ${brand.name}` },
  description: brand.description,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#071019",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body><SettingsEffects /><CloudSyncProvider>{children}</CloudSyncProvider></body>
    </html>
  );
}
