"use client";

import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";

type Messages = Record<string, Record<string, string | Record<string, string>>>;

export default function ClientLayout({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Messages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
