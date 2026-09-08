"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "홈" },
  { href: "/favorites", label: "즐겨찾기" },
  { href: "/wrong", label: "오답노트" },
  { href: "/history", label: "기록" },
  { href: "/settings", label: "설정" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-2xl items-center gap-1 px-4 py-3">
        {/* 워드마크 — 지오글·리프린트OCR 과 같은 표시용 글꼴에 자간을 넓혀
            상표처럼 보이게 한다(지오글의 .g3-logo 와 같은 처리다). */}
        <Link
          href="/"
          className="mr-2 shrink-0 font-display text-lg font-semibold tracking-[0.06em]"
        >
          VDIC
        </Link>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
