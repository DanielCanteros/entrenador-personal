import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Header from "../../components/Header.js";
import Footer from "../../components/Footer.js";

export default async function RegistroLayout({ children }) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Header showLanguageSwitcher={false} />
      <main id="main-content">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
