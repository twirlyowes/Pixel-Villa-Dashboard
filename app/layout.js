import "./globals.css";

export const metadata = {
  title: "Pixel Villa Dashboard",
  description: "Staff dashboard for Pixel Villa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
