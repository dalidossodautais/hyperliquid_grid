"use client";

import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";

interface ProvidersWrapperProps {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, Record<string, string | Record<string, string>>>;
}

export default function ProvidersWrapper({
  children,
  locale,
  messages,
}: ProvidersWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
