import { Crimson_Pro, JetBrains_Mono } from "next/font/google";

const crimson = Crimson_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-crimson",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "Allons Jouer — rahdoht",
  description: "Cajun Accordion in C — Learn by Playing",
};

export default function AllonsJouerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${crimson.variable} ${jetbrains.variable}`}>
      {children}
    </div>
  );
}
