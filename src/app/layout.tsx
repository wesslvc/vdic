import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

// 표시용 글꼴 — 로고와 숫자에 쓴다. 지오글·리프린트OCR 과 같은 글꼴이다.
// 본문(Pretendard)은 구글 폰트가 아니라 next/font 로 못 받으므로 아래에서
// CDN 으로 가져온다(같은 브랜드의 다른 두 사이트도 같은 주소를 쓴다).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VDIC · 영단어 학습",
  description: "강의별 영단어 학습, 오답노트, 학습 기록 — NEPICA",
  // 파비콘은 로고와 같은 그림(책을 문 물까치)을 쓴다. 크기별로 두 벌을 두어
  // 탭·홈 화면 어디에서든 뭉개지지 않게 한다(리프린트OCR 과 같은 방식이다).
  icons: {
    icon: [
      { url: "/brand/magpie-book-64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/magpie-book-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/magpie-book-192.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 브랜드 바탕색(지오글의 --bg)과 같은 값이다. 다크 화면에서 주소창까지
  // 이어져 보이게 한다.
  themeColor: "#14171c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <NavBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        {/* 만든 곳 표기 — 사이트는 VDIC, 브랜드는 NEPICA. */}
        <footer className="flex justify-center pb-8 pt-4">
          <a
            href="https://nepica.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="nepica-brand text-neutral-500"
          >
            NEPICA
          </a>
        </footer>
      </body>
    </html>
  );
}
