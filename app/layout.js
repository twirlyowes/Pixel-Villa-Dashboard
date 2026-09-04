import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Pixel Villa Dashboard",
  description: "Staff dashboard for Pixel Villa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}