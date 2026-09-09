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
        {/* 마크 + 워드마크 — 마크는 **책을 문 물까치**다. 같은 브랜드(NEPICA)의
            지오글은 지구본을, 리프린트OCR 은 종이를 물고 있고, 브랜드 자체는
            아무것도 물지 않은 새를 쓴다 — 무엇을 물고 있느냐로 제품을 가른다.
            그림 파일을 쓰는 이유는 그라디언트가 겹겹이 든 그림이라 손으로 그린
            SVG 로는 같은 모양이 안 나오기 때문이고, 검은 바탕은 **가장자리에서
            시작하는 채우기**로 지웠다(밝기로 지우면 새의 검은 두건까지 잘린다).
            글꼴은 지오글·리프린트OCR 과 같은 표시용 글꼴에 자간을 넓혀 상표처럼
            보이게 한다(지오글의 .g3-logo 와 같은 처리다). */}
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-1.5 font-display text-lg font-semibold tracking-[0.06em]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/magpie-book-512.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
            decoding="async"
            draggable={false}
          />
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
