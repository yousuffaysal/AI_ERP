import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Core ERP | AI Powered Operations",
    description: "Enterprise Resource Planning system enhanced with Machine Learning.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="bg-slate-50">
            <body className={`${inter.className} text-slate-900 antialiased`}>
                {children}
            </body>
        </html>
    );
}
