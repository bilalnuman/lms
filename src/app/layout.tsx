import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import BreadcrumbsClient from "@/components/BreadcrumbsClient";

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
        <Header />
        <Sidebar />
        <main className="xl:ps-38 ps-60 pt-16 pe-4">
          <BreadcrumbsClient
            rootLabel="Dashboard"
            labels={{ students: "Students" }}
          />
          {children}</main>
      </body>
    </html>
  );
}
