import type { Metadata } from "next";
import { Instrument_Serif, Manrope, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const instrument = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument" });
const ibmPlexSans = IBM_Plex_Sans({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-ibm-sans" });
const ibmPlexSerif = IBM_Plex_Serif({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-ibm-serif" });

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
            <body className={`${manrope.variable} ${instrument.variable} ${ibmPlexSans.variable} ${ibmPlexSerif.variable} font-sans text-slate-900 dark:text-[#EAEAEA] antialiased min-h-screen selection:bg-[#E2FF00] selection:text-black`} suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
