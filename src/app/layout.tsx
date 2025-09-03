import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import BreadcrumbsClient from "@/components/BreadcrumbsClient";
import Footer from "@/components/Footer";

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
        <main className="xl:ps-38 ps-60 pt-16 pe-3 duration-300 transition-all ease-in-out">
          <div className="min-h-[calc(100vh-6rem)] pb-10">
            <BreadcrumbsClient
              rootLabel="Dashboard"
              labels={{ students: "Students" }}
            />
            {children}
          </div>
          <Footer />
        </main>
      </body>
    </html>
  );
}
