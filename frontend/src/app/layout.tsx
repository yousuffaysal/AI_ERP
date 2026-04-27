import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const instrument = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
    title: "AI ERP | Enterprise Intelligence",
    description: "Enterprise Resource Planning system enhanced with Machine Learning.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="bg-[#f0ece1] dark:bg-[#070707]" suppressHydrationWarning>
            <body className={`${manrope.variable} ${instrument.variable} font-sans text-slate-900 dark:text-[#EAEAEA] antialiased min-h-screen selection:bg-[#E2FF00] selection:text-black`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
