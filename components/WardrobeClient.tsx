"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  User,
  X,
  AlertCircle,
  ShirtIcon,
  RefreshCw,
  Download,
} from "lucide-react";
import { useWardrobe, dataUrlToFile } from "@/hooks/useWardrobe";
import type { WardrobeItem } from "@/hooks/useWardrobe";

const POLL_INTERVAL_MS = 2500;
const PROGRESS_TICK = 3;
const PROGRESS_CAP = 95;

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

// ─── Full-width Image Panel ───────────────────────────────────────────────────

// ─── Fullscreen Lightbox ──────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Look completo"
        className="w-full h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Image Panel ──────────────────────────────────────────────────────────────

function ImagePanel({
  result,
  userPhoto,
  onUserPhotoFile,
  onClearUserPhoto,
  onClearResult,
  generating,
}: {
  result: string | null;
  userPhoto: string | null;
  onUserPhotoFile: (f: File) => void;
  onClearUserPhoto: () => void;
  onClearResult: () => void;
  generating: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState(false);
  const src = result ?? userPhoto;

  return (
    <div className="relative w-full bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50">
      {lightbox && src && (
        <Lightbox src={src} onClose={() => setLightbox(false)} />
      )}

      {src ? (
        <>
          {/* Tap image to open fullscreen — only when not generating */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={result ? "Look gerado" : "Sua foto"}
            onClick={() => { if (!generating) setLightbox(true); }}
            className={`w-full h-auto transition-opacity duration-500 ${generating ? "opacity-40" : "opacity-100 cursor-zoom-in"}`}
          />

          {generating && (
            <div className="absolute inset-0 shimmer pointer-events-none" />
          )}

          {/* Action buttons top-right */}
          <div className="absolute top-3 right-3 flex gap-2">
            {result && (
              <a
                href={result}
                download="look.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={result ? onClearResult : onClearUserPhoto}
              className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
            >
              {result ? <RefreshCw className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>

          {result && !generating && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Toque para ampliar
            </div>
          )}
        </>
      ) : generating ? (
        // Generating animation — no photo yet
        <div className="w-full py-20 flex flex-col items-center justify-center gap-5 overflow-hidden relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-amber-50 to-violet-100 animate-pulse" />

          {/* Spinning ring */}
          <div className="relative z-10 w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-rose-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-400 animate-spin" />
            <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Sparkles className="w-7 h-7 text-rose-400 animate-float" />
            </div>
          </div>

          {/* Shimmer bars */}
          <div className="relative z-10 w-48 space-y-2">
            <div className="h-2.5 rounded-full bg-white/60 overflow-hidden">
              <div className="h-full w-full shimmer" />
            </div>
            <div className="h-2 rounded-full bg-white/40 overflow-hidden w-3/4 mx-auto">
              <div className="h-full w-full shimmer" />
            </div>
          </div>

          <p className="relative z-10 text-xs font-semibold text-rose-400">Gerando seu look...</p>
        </div>
      ) : (
        // Empty — tap to upload
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-4 py-20 group"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/70 backdrop-blur-sm border-2 border-dashed border-rose-200 flex items-center justify-center group-hover:border-rose-400 transition-colors shadow-sm">
            <User className="w-9 h-9 text-rose-300 group-hover:text-rose-500 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Adicione sua foto</p>
            <p className="text-xs text-gray-400 mt-0.5">para ver o look em voce</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUserPhotoFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, stage }: { progress: number; stage: Stage }) {
  const label: Record<Stage, string> = {
    idle: "",
    uploading: "Enviando imagens...",
    processing: "Gerando o look com IA...",
    done: "Pronto!",
    error: "",
  };
  return (
    <div className="px-4 py-2.5 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">{label[stage]}</span>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 transition-all duration-700 progress-bar-animated"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Wardrobe Grid ────────────────────────────────────────────────────────────

function WardrobeGrid({
  items,
  selected,
  onToggle,
  onRemove,
  onAddFile,
  disabled,
}: {
  items: WardrobeItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAddFile: (f: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  return (
    <div className={`px-4 pt-4 pb-2 transition-opacity duration-300 ${disabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShirtIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-800">Meu Guarda-Roupa</span>
          {items.length > 0 && (
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-semibold">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {items.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full py-10 rounded-3xl border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 flex flex-col items-center gap-2 transition-all group"
        >
          <Plus className="w-7 h-7 text-gray-300 group-hover:text-rose-400 transition-colors" />
          <p className="text-xs text-gray-400">Adicione roupas para montar looks</p>
        </button>
      ) : (
        <>
          {/* 4-column grid — tight thumbnails */}
          <div className="grid grid-cols-4 gap-2">
            {items.map((item) => {
              const sel = selected.has(item.id);
              const removing = pendingRemove === item.id;

              return (
                <div key={item.id} className="relative aspect-square">
                  <button
                    onClick={() => {
                      if (removing) { setPendingRemove(null); return; }
                      onToggle(item.id);
                    }}
                    onContextMenu={(e) => { e.preventDefault(); setPendingRemove(item.id); }}
                    className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all active:scale-95
                      ${sel
                        ? "border-rose-400 shadow-md shadow-rose-100"
                        : "border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />

                    {/* Selected overlay */}
                    {sel && (
                      <div className="absolute inset-0 bg-rose-400/10 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-rose-500 shadow flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">
                            {Array.from(selected).indexOf(item.id) + 1}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Remove badge */}
                  {removing && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(item.id); setPendingRemove(null); }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md animate-fade-in-up z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add button in grid */}
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 flex items-center justify-center transition-all group"
            >
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-amber-400 transition-colors" />
            </button>
          </div>

          <p className="mt-2.5 text-center text-[10px] text-gray-300">
            Toque para selecionar · Segure para remover
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAddFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WardrobeClient() {
  const wardrobe = useWardrobe();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayResult = currentResult ?? wardrobe.lastResult ?? null;
  const generating = stage === "uploading" || stage === "processing";

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const canGenerate = selected.size > 0 && !!wardrobe.userPhoto && !generating;

  const handleGenerate = async () => {
    if (!canGenerate || !wardrobe.userPhoto) return;

    setErrorMsg(null);
    setStage("uploading");
    setProgress(20);

    const userFile = dataUrlToFile(wardrobe.userPhoto, "user.jpg");
    const garmentFiles = wardrobe.garments
      .filter((g) => selected.has(g.id))
      .map((g) => dataUrlToFile(g.dataUrl, g.name));

    const body = new FormData();
    body.append("human_img", userFile);
    garmentFiles.forEach((f) => body.append("garments[]", f));

    let predictionId: string;
    try {
      const res = await fetch("/api/generate", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      predictionId = data.id;
    } catch (err) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao iniciar geracao.");
      return;
    }

    setStage("processing");
    setProgress(60);

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/generate/${predictionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

        if (data.status === "succeeded") {
          const url = data.output as string;
          setCurrentResult(url);
          wardrobe.saveLastResult(url);
          setStage("done");
          setProgress(100);
          setTimeout(() => { setStage("idle"); setProgress(0); }, 2000);
          return;
        }

        if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error ?? "Geracao falhou.");
        }

        setProgress((p) => Math.min(p + PROGRESS_TICK, PROGRESS_CAP));
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        return poll();
      } catch (err) {
        setStage("error");
        setErrorMsg(err instanceof Error ? err.message : "Erro durante a geracao.");
      }
    };

    await poll();
  };

  if (!wardrobe.ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-500 animate-float flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-rose-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/try" className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">Meu Guarda-Roupa</span>
          </div>
          {wardrobe.garments.length > 0 && (
            <button
              onClick={() => { if (confirm("Limpar todo o guarda-roupa?")) { wardrobe.clearAll(); setSelected(new Set()); setCurrentResult(null); } }}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {(generating || stage === "done") && (
        <ProgressBar progress={progress} stage={stage} />
      )}

      {/* Error */}
      {stage === "error" && errorMsg && (
        <div className="mx-4 mt-3 flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-xs text-red-600">{errorMsg}</p>
          <button onClick={() => { setStage("idle"); setErrorMsg(null); }}>
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Full-width image */}
      <ImagePanel
        result={displayResult}
        userPhoto={wardrobe.userPhoto}
        onUserPhotoFile={(f) => wardrobe.saveUserPhoto(f)}
        onClearUserPhoto={wardrobe.clearUserPhoto}
        onClearResult={() => { setCurrentResult(null); wardrobe.saveLastResult(""); }}
        generating={generating}
      />

      {/* Scrollable wardrobe below image */}
      <div className="flex-1 overflow-y-auto pb-36 max-w-lg mx-auto w-full">
        <WardrobeGrid
          items={wardrobe.garments}
          selected={selected}
          onToggle={toggleItem}
          onRemove={wardrobe.removeGarment}
          onAddFile={(f) => wardrobe.addGarment(f)}
          disabled={generating}
        />
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4 backdrop-blur-md bg-white/85 border-t border-gray-100">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Missing user photo hint */}
          {!wardrobe.userPhoto && selected.size > 0 && (
            <p className="text-center text-xs text-amber-600 font-medium animate-fade-in-up">
              Adicione sua foto acima para gerar o look
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2
              ${canGenerate
                ? "bg-gradient-to-r from-rose-500 via-rose-500 to-violet-500 text-white shadow-lg shadow-rose-200 hover:opacity-90 active:scale-[0.98] pulse-cta"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
          >
            <Sparkles className={`w-5 h-5 ${canGenerate ? "text-white" : "text-gray-300"}`} />
            {generating
              ? "Gerando..."
              : selected.size > 0
              ? `Gerar Look com ${selected.size} ${selected.size === 1 ? "peça" : "peças"}`
              : "Selecione as roupas abaixo"}
          </button>

          {/* Mini dots — quick deselect all */}
          {selected.size > 0 && !generating && (
            <button
              onClick={() => setSelected(new Set())}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Limpar seleção ({selected.size})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
