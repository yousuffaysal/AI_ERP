import type { Metadata } from "next";
import { Instrument_Serif, Manrope, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
        <html lang="en" className={cn("bg-[#f0ece1] dark:bg-[#070707]", "font-sans", geist.variable)} suppressHydrationWarning>
            <body className={`${manrope.variable} ${instrument.variable} font-sans text-slate-900 dark:text-[#EAEAEA] antialiased min-h-screen selection:bg-[#E2FF00] selection:text-black`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
