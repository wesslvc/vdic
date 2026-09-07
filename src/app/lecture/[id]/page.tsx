"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLecture, getLectures, getWordCatalogLecture } from "@/lib/catalog";
import { getWordById, lectureProgress, wordsForLecture } from "@/lib/derived";
import {
  addCustomWord,
  deleteCustomWord,
  getWordStat,
  moveWordToLecture,
  setMeaningOverride,
  setMemo,
  setNuanceNote,
  toggleFavorite,
  useProgress,
} from "@/lib/progressStore";
import { StudySession } from "@/components/StudySession";
import { SymbolButtons } from "@/components/SymbolButtons";
import { useMounted } from "@/hooks/useMounted";

export default function LecturePage() {
  const params = useParams<{ id: string }>();
  const lectureId = Number(params.id);
  const mounted = useMounted();
  const progress = useProgress();
  const [mode, setMode] = useState<"browse" | "study">("browse");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState("");
  const [editNuance, setEditNuance] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newMeaning, setNewMeaning] = useState("");

  const lecture = getLecture(lectureId);
  const allLectures = getLectures();
  const words = useMemo(() => wordsForLecture(lectureId, progress), [lectureId, progress]);
  const prog = lectureProgress(lectureId, progress);

  if (!lecture) {
    return <p className="text-neutral-500">강의를 찾을 수 없어요.</p>;
  }

  if (mode === "study") {
    return (
      <div>
        <button
          onClick={() => setMode("browse")}
          className="mb-4 text-sm text-neutral-500"
        >
          ← 그만하기
        </button>
        <StudySession
          words={words}
          sessionLabel={`${lecture.title} 학습`}
          mode="study"
          onFinish={() => setMode("browse")}
        />
      </div>
    );
  }

  function startEdit(wordId: string, currentMeaning: string, currentNuance?: string, currentMemo?: string) {
    setEditingId(wordId);
    setEditMeaning(currentMeaning);
    setEditNuance(currentNuance ?? "");
    setEditMemo(currentMemo ?? "");
  }

  function saveEdit(wordId: string) {
    const baseMeaning = getWordById(wordId, progress)?.meaning ?? "";
    setMeaningOverride(wordId, editMeaning, baseMeaning);
    setNuanceNote(wordId, editNuance);
    setMemo(wordId, editMemo);
    setEditingId(null);
  }

  function saveNewWord() {
    if (!newTerm.trim() || !newMeaning.trim()) return;
    addCustomWord(newTerm, newMeaning, lectureId);
    setNewTerm("");
    setNewMeaning("");
    setAdding(false);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-neutral-500">
        ← 강의 목록
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold">{lecture.title}</h1>
          <p className="text-sm text-neutral-500">{lecture.subtitle}</p>
        </div>
        <div className="text-right text-sm text-neutral-500">
          <p>
            {mounted ? prog.mastered : 0}/{prog.total} 완료
          </p>
          {mounted && prog.wrongCount > 0 && (
            <p className="text-rose-600 dark:text-rose-400">오답 {prog.wrongCount}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => setMode("study")}
        className="mt-4 w-full rounded-xl bg-neutral-900 py-3.5 font-semibold text-white dark:bg-white dark:text-neutral-900"
      >
        이 강의 학습하기 ({words.length}개)
      </button>

      <div className="mt-4">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm font-medium text-neutral-500 dark:border-neutral-700"
          >
            + 새 단어 추가
          </button>
        ) : (
          <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <input
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="단어 (영어)"
              autoComplete="off"
              autoCapitalize="off"
              className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
            <textarea
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="뜻"
              rows={2}
              className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
            <div className="flex gap-2">
              <button
                onClick={saveNewWord}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTerm("");
                  setNewMeaning("");
                }}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-700"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-neutral-500">단어 목록</h2>
      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {words.map((w) => {
          const stat = mounted ? getWordStat(w.id) : null;
          const isCustom = w.id.startsWith("c");
          const catalogLec = isCustom ? lectureId : getWordCatalogLecture(w.id);
          const isEditing = editingId === w.id;
          return (
            <li key={w.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {w.term}
                    {isCustom && (
                      <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-normal text-neutral-500 dark:bg-neutral-800">
                        직접 추가
                      </span>
                    )}
                  </p>
                  {!isEditing && (
                    <p className="truncate text-sm text-neutral-500">
                      {w.meaning}
                      {w.nuance && (
                        <span className="ml-1.5 text-neutral-400">· {w.nuance}</span>
                      )}
                    </p>
                  )}
                </div>
                {stat?.lastResult === "wrong" && (
                  <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                    오답
                  </span>
                )}
                {stat?.lastResult === "correct" && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    완료
                  </span>
                )}
                <button
                  onClick={() => toggleFavorite(w.id)}
                  className={`shrink-0 text-lg ${
                    progress.favorites[w.id] ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600"
                  }`}
                  aria-label="즐겨찾기"
                >
                  {progress.favorites[w.id] ? "★" : "☆"}
                </button>
                <button
                  onClick={() =>
                    isEditing ? setEditingId(null) : startEdit(w.id, w.meaning, w.nuance, w.memo)
                  }
                  className="shrink-0 text-xs text-neutral-400 underline"
                >
                  {isEditing ? "취소" : "수정"}
                </button>
                <select
                  value={lectureId}
                  onChange={(e) => moveWordToLecture(w.id, Number(e.target.value), catalogLec)}
                  className="shrink-0 rounded-lg border border-neutral-300 bg-white px-1.5 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                  title="단어를 다른 강의로 재배정"
                >
                  {allLectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id}강
                    </option>
                  ))}
                </select>
              </div>
              {isEditing && (
                <div className="mt-2.5 space-y-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">뜻</label>
                    <textarea
                      value={editMeaning}
                      onChange={(e) => setEditMeaning(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <div className="mt-1.5">
                      <SymbolButtons
                        variant="relation"
                        onInsert={(s) => setEditMeaning((v) => v + s)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">
                      뉘앙스/관계 (선택, 예: +, -, A→B) · 시험볼 때 물어봐요
                    </label>
                    <input
                      value={editNuance}
                      onChange={(e) => setEditNuance(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <div className="mt-1.5">
                      <SymbolButtons onInsert={(s) => setEditNuance((v) => v + s)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">
                      메모 (선택) · 정답/오답과 상관없이 항상 보여줘요, 시험엔 안 나와요
                    </label>
                    <textarea
                      value={editMemo}
                      onChange={(e) => setEditMemo(e.target.value)}
                      rows={2}
                      placeholder="예문, 헷갈리는 포인트 등 자유롭게"
                      className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(w.id)}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900"
                    >
                      저장
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => {
                          deleteCustomWord(w.id);
                          setEditingId(null);
                        }}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:border-rose-900"
                      >
                        이 단어 삭제
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
