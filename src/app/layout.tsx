import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Usta Takip",
  description: "Modern İş ve Şantiye Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 text-slate-800 flex flex-col h-[100dvh] overflow-hidden`}>
        {/* Üst Bilgi Barı */}
        <header className="bg-white border-b border-slate-200 px-4 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
          <h1 className="font-bold text-lg text-slate-800 tracking-tight">Teklif Havuzu</h1>
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            E
          </div>
        </header>

        {/* Ana İçerik Alanı */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative pb-24">
          {children}
        </main>
        
        {/* Alt navigasyon barı buradan kaldırıldı. Artık page.tsx içinde! */}
      </body>
    </html>
  );
}