import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// IBM Plex Sans/Mono are the General Purpose brand's secondary typefaces
// (per the brand guide: Plex Sans for subheadlines/body, Plex Mono for
// labels/structure). The brand guide's primary headline face is "Exposure",
// a licensed Klim Type Foundry serif with no web-font distribution — rather
// than substitute an unrelated stand-in serif, headings here use IBM Plex
// Sans Bold too, so the whole UI reads as one consistent system. If the
// licensed Exposure webfont files are ever added to the project, only the
// "Uhura" title styling in app/page.tsx needs to change.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Uhura Language Map — LLM Benchmarks for Low-Resource Languages",
  description:
    "A crowdsourced atlas mapping LLM evaluation benchmarks to low-resource languages around the world. Discover which languages have benchmarks and which still need them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
