"use client";

import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";

interface ClientLayoutProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, Record<string, string | Record<string, string>>>;
}

export default function ClientLayout({
  children,
  locale,
  messages,
}: ClientLayoutProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
