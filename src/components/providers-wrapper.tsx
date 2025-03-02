"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { Providers } from "@/app/providers";

export default function ProvidersWrapper({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
