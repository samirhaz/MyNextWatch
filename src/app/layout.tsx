import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "MyNextWatch — Your next great story", template: "%s | MyNextWatch" },
  description:
    "A personal home for the movies and shows you love. Track your watchlist, rate your favorites, and curate your own collections.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: { background: "#202322", border: "1px solid #393c39", color: "#f4f3ee" },
          }}
        />
      </body>
    </html>
  );
}
