import type { Metadata } from "next";
import Header from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import BreadcrumbsClient from "@/components/widgets/BreadcrumbsClient";
import Footer from "@/components/Footer";

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
        <>
            <Header />
            <Sidebar />
            <main className="xl:ps-38 ps-60 pt-20 pe-3 duration-300 transition-all ease-in-out">
                <div className="min-h-[calc(100vh-6rem)] pb-10">
                    <BreadcrumbsClient
                        rootLabel="Dashboard"
                        labels={{ students: "Students" }}
                    />
                    {children}
                </div>
                <Footer />
            </main>
        </>
    );
}
