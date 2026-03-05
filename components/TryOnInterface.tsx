"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Sparkles,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

interface ProgressStage {
  label: string;
  progress: number;
}

const STAGES: Record<Stage, ProgressStage> = {
  idle:       { label: "",                         progress: 0  },
  uploading:  { label: "Enviando imagens...",       progress: 20 },
  processing: { label: "Gerando o look com IA...", progress: 60 },
  done:       { label: "Pronto!",                  progress: 100 },
  error:      { label: "Algo deu errado.",         progress: 0  },
};

const POLL_INTERVAL_MS = 2500;
const PROGRESS_TICK = 3;
const PROGRESS_CAP = 95;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;
const MAX_GARMENTS = 6;

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

function validateFile(f: File): string | null {
  if (!ACCEPTED_TYPES.includes(f.type)) return "Use JPG, PNG ou WEBP.";
  if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Maximo ${MAX_SIZE_MB}MB.`;
  return null;
}

// ─── User Photo Card ──────────────────────────────────────────────────────────

function UserPhotoCard({
  preview,
  error,
  onFile,
  onClear,
}: {
  preview: string | null;
  error: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm overflow-hidden border-2 transition-all
        ${dragging ? "border-rose-400 scale-[1.01]" : "border-transparent"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 to-pink-500" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Sua Foto</p>
            <p className="text-xs text-gray-400">Corpo inteiro ou busto</p>
          </div>
          {preview && (
            <button onClick={onClear} className="ml-auto w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Sua foto" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <Upload className="w-6 h-6 text-gray-300 group-hover:text-rose-400 transition-colors" />
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Toque para enviar</p>
              <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG ou WEBP</p>
            </div>
          </button>
        )}

        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Garments Card ────────────────────────────────────────────────────────────

const GARMENT_LABELS = ["Peça 1", "Peça 2", "Peça 3", "Peça 4", "Peça 5", "Peça 6"];

function GarmentsCard({
  garments,
  onAdd,
  onRemove,
  error,
}: {
  garments: ImageFile[];
  onAdd: (f: File) => void;
  onRemove: (id: string) => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = garments.length < MAX_GARMENTS;

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border-2 border-transparent">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-violet-400" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-violet-400 flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">As Roupas</p>
            <p className="text-xs text-gray-400">Adicione até {MAX_GARMENTS} peças</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">
            {garments.length}/{MAX_GARMENTS}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Existing garments */}
          {garments.map((g, i) => (
            <div key={g.id} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.preview} alt={GARMENT_LABELS[i]} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                onClick={() => onRemove(g.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1 left-1 text-[9px] font-semibold text-white/80 bg-black/40 px-1 rounded">
                {GARMENT_LABELS[i]}
              </span>
            </div>
          ))}

          {/* Add button */}
          {canAdd && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 flex flex-col items-center justify-center gap-1 transition-all group"
            >
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-amber-400 transition-colors" />
              <span className="text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors">Adicionar</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onAdd(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

function LoadingOverlay({ stage, progress }: { stage: Stage; progress: number }) {
  const info = STAGES[stage];
  return (
    <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500 via-amber-400 to-violet-500 flex items-center justify-center shadow-xl shadow-rose-200 animate-float">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{info.label}</p>
          <p className="text-sm text-gray-400 mt-1">
            {stage === "processing" ? "Isso pode levar ~30 segundos..." : "Aguarde um momento..."}
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 transition-all duration-700 ease-out progress-bar-animated"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right">{progress}%</p>
        </div>
        <div className="relative h-24 rounded-2xl bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 shimmer" />
          <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-300">
            Seu look sera exibido em breve
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TryOnInterface() {
  const router = useRouter();

  const [userFile, setUserFile] = useState<File | null>(null);
  const [userPreview, setUserPreview] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const [garments, setGarments] = useState<ImageFile[]>([]);
  const [garmentError, setGarmentError] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUserFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) { setUserError(err); return; }
    setUserError(null);
    setUserFile(f);
    setUserPreview(URL.createObjectURL(f));
  }, []);

  const clearUser = useCallback(() => {
    if (userPreview) URL.revokeObjectURL(userPreview);
    setUserFile(null);
    setUserPreview(null);
    setUserError(null);
  }, [userPreview]);

  const addGarment = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) { setGarmentError(err); return; }
    setGarmentError(null);
    setGarments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), file: f, preview: URL.createObjectURL(f) },
    ]);
  }, []);

  const removeGarment = useCallback((id: string) => {
    setGarments((prev) => {
      const g = prev.find((x) => x.id === id);
      if (g) URL.revokeObjectURL(g.preview);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (userPreview) URL.revokeObjectURL(userPreview);
      garments.forEach((g) => URL.revokeObjectURL(g.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canGenerate = !!userFile && garments.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || !userFile) return;

    setErrorMsg(null);
    setStage("uploading");
    setProgress(STAGES.uploading.progress);

    const body = new FormData();
    body.append("human_img", userFile);
    garments.forEach((g) => body.append("garments[]", g.file));

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
    setProgress(STAGES.processing.progress);

    const poll = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/generate/${predictionId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

        if (data.status === "succeeded") {
          setStage("done");
          setProgress(100);
          router.push(`/result/${predictionId}?output=${encodeURIComponent(data.output as string)}`);
          return;
        }

        if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error ?? "Geracao falhou no Replicate.");
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

  const handleReset = () => {
    setStage("idle");
    setProgress(0);
    setErrorMsg(null);
  };

  return (
    <>
      {(stage === "uploading" || stage === "processing" || stage === "done") && (
        <LoadingOverlay stage={stage} progress={progress} />
      )}

      {stage === "error" && errorMsg && (
        <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">Algo deu errado</p>
            <p className="text-xs text-red-500 mt-0.5 break-words">{errorMsg}</p>
          </div>
          <button onClick={handleReset} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4 pb-28">
        <UserPhotoCard
          preview={userPreview}
          error={userError}
          onFile={handleUserFile}
          onClear={clearUser}
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs font-bold text-gray-300 px-2">+</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <GarmentsCard
          garments={garments}
          onAdd={addGarment}
          onRemove={removeGarment}
          error={garmentError}
        />
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 backdrop-blur-md bg-white/80 border-t border-gray-100">
        <div className="max-w-sm mx-auto">
          <button
            onClick={stage === "error" ? handleReset : handleGenerate}
            disabled={(!canGenerate && stage !== "error") || stage === "uploading" || stage === "processing"}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2
              ${canGenerate || stage === "error"
                ? "bg-gradient-to-r from-rose-500 via-rose-500 to-violet-500 text-white shadow-lg shadow-rose-200 hover:opacity-90 active:scale-95 pulse-cta"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
          >
            <Sparkles className={`w-5 h-5 ${canGenerate || stage === "error" ? "text-white" : "text-gray-300"}`} />
            {stage === "uploading" || stage === "processing"
              ? "Gerando..."
              : stage === "error"
              ? "Tentar novamente"
              : `Gerar Meu Look${garments.length > 1 ? ` (${garments.length} peças)` : ""}`}
          </button>

          <div className="flex justify-center gap-4 mt-2">
            <span className={`flex items-center gap-1 text-xs ${userFile ? "text-green-500" : "text-gray-300"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${userFile ? "bg-green-400" : "bg-gray-200"}`} />
              Sua foto
            </span>
            <span className={`flex items-center gap-1 text-xs ${garments.length > 0 ? "text-green-500" : "text-gray-300"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${garments.length > 0 ? "bg-green-400" : "bg-gray-200"}`} />
              {garments.length > 0 ? `${garments.length} peça${garments.length > 1 ? "s" : ""}` : "Roupas"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
