"use client";

import { useRef, useState } from "react";
import { exportProgressJSON, importProgressJSON, resetProgress } from "@/lib/progressStore";
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

  function handleReset() {
    if (confirm("모든 학습 진행상황이 삭제돼요. 계속할까요?")) {
      resetProgress();
      setMessage("초기화했어요.");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold">설정</h1>
      <p className="mt-1 text-sm text-neutral-500">
        학습 데이터는 이 기기의 브라우저에만 저장돼요. 다른 기기에서 이어서 하려면 백업 파일을
        내보낸 뒤 그 기기에서 불러오세요.
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
          onClick={handleReset}
          className="w-full rounded-xl bg-rose-600 py-3 font-medium text-white"
        >
          전체 진행상황 초기화
        </button>
      </div>
    </div>
  );
}
