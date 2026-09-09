"use client";

import { useRef, useState } from "react";
import {
  exportProgressJSON,
  importProgressJSON,
  resetEverything,
  resetStudyProgress,
  syncNow,
} from "@/lib/progressStore";
import { getSyncSecret, setSyncSecret } from "@/lib/sync";
import { useMounted } from "@/hooks/useMounted";
import { todayStr } from "@/lib/date";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useMounted();
  const [message, setMessage] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [syncing, setSyncing] = useState(false);

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

  function handleSaveSecret() {
    setSyncSecret(secretInput);
    setMessage(secretInput ? "동기화 비밀번호를 저장했어요." : "동기화 비밀번호를 지웠어요.");
  }

  async function handleSyncNow() {
    setSyncing(true);
    const result = await syncNow();
    setSyncing(false);
    setMessage(result.ok ? "GitHub에 동기화했어요." : `동기화 실패: ${result.error}`);
  }

  const hasSecret = mounted && getSyncSecret().length > 0;

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

      <h2 className="mb-2 mt-6 flex items-center gap-2 text-sm font-semibold text-neutral-500">
        GitHub 동기화 {mounted && (hasSecret ? "(설정됨)" : "(미설정)")}
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
          관리자 전용
        </span>
      </h2>
      <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
        ⚠️ 이 비밀번호는 GitHub 저장소에 직접 쓰기 권한을 갖는 관리자용 자격 증명이에요. 본인만
        알고 있어야 하고, 다른 사람과 공유하거나 캡처해서 보내면 안 돼요. 이 기기에만 저장되며,
        입력하는 순간 이후의 모든 수정 내용이 실제 저장소에 반영돼요.
      </p>
      <p className="mb-3 text-xs text-neutral-500">
        동기화 비밀번호를 설정하면 뜻 수정·뉘앙스·강의 재배정이 저장할 때마다 GitHub 저장소에도
        반영돼요. 브라우저 데이터를 지우거나 기기를 바꿔도 그대로 남아있어요. (서버 쪽 설정이
        아직 안 되어 있으면 비밀번호를 설정해도 동기화는 조용히 실패해요 — 서버 환경변수
        설정이 먼저 필요해요.)
      </p>
      <div className="space-y-2">
        <input
          type="password"
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          placeholder="동기화 비밀번호"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveSecret}
            className="rounded-lg border border-neutral-300 py-2 text-sm font-medium dark:border-neutral-700"
          >
            비밀번호 저장
          </button>
          <button
            onClick={handleSyncNow}
            disabled={syncing || !hasSecret}
            className="rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            {syncing ? "동기화 중..." : "지금 동기화"}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-3">
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
