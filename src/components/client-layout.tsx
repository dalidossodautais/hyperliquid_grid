"use client";

import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";
import NotificationContainer from "@/components/ui/NotificationContainer";

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
      <Providers>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <NotificationContainer />
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
