import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "rahdoht",
  description: "just a couch doing its part",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} bg-neutral-950 text-neutral-100 min-h-screen font-mono`}>
        <Providers>
          <Nav>{children}</Nav>
        </Providers>
      </body>
    </html>
  );
}
