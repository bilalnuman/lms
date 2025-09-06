import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Providers from "./providers/providers";

const archivo = Archivo({
  variable: "--font-archivo-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PC(LMS) ",
  description: "Learning management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable}  antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
