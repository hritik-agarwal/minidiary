import { Indie_Flower } from "next/font/google";
import "./globals.css";

const indieFlower = Indie_Flower({
  variable: "--font-indie-flower",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "My Diary",
  description: "Simple diary to note down daily thoughts!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${indieFlower.variable} antialiased`}>{children}</body>
    </html>
  );
}
