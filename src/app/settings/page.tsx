"use client";

import { useRef, useState } from "react";
import {
  exportProgressJSON,
  importProgressJSON,
  resetEverything,
  resetStudyProgress,
} from "@/lib/progressStore";
import { todayStr } from "@/lib/date";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const json = exportProgressJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vdic-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importProgressJSON(String(reader.result));
      setMessage(result.ok ? "백업을 불러왔어요." : result.error);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleResetStudy() {
    if (confirm("학습 기록(정답/오답, 학습 로그)이 삭제돼요. 뜻 수정·뉘앙스·강의 재배정은 그대로 남아요. 계속할까요?")) {
      resetStudyProgress();
      setMessage("학습 기록을 초기화했어요. 수정한 뜻/뉘앙스/강의 배정은 남아있어요.");
    }
  }

  function handleResetEverything() {
    if (confirm("뜻 수정, 뉘앙스, 강의 재배정까지 포함해서 전부 삭제돼요. 정말 계속할까요?")) {
      resetEverything();
      setMessage("전부 초기화했어요.");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold">설정</h1>
      <p className="mt-1 text-sm text-neutral-500">
        학습 데이터는 이 기기의 브라우저에만 저장돼요. 다른 기기에서 이어서 하려면 백업 파일을
        내보낸 뒤 그 기기에서 불러오세요. 뜻 수정·뉘앙스·강의 재배정은 학습 기록을 초기화해도
        지워지지 않아요.
      </p>

      {message && (
        <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={handleExport}
          className="w-full rounded-xl border border-neutral-300 bg-white py-3 font-medium dark:border-neutral-700 dark:bg-neutral-900"
        >
          백업 내보내기 (JSON 다운로드)
        </button>
        <button
          onClick={handleImportClick}
          className="w-full rounded-xl border border-neutral-300 bg-white py-3 font-medium dark:border-neutral-700 dark:bg-neutral-900"
        >
          백업 불러오기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleResetStudy}
          className="w-full rounded-xl bg-rose-600 py-3 font-medium text-white"
        >
          학습 기록 초기화 (수정 내용은 유지)
        </button>
        <button
          onClick={handleResetEverything}
          className="w-full rounded-xl border border-rose-300 py-3 text-sm font-medium text-rose-600 dark:border-rose-900"
        >
          뜻 수정·뉘앙스·강의 배정까지 전부 초기화
        </button>
      </div>
    </div>
  );
}
