"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Link as LinkIcon,
  X,
  Sparkles,
  User,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

type Tab = "upload" | "url";
type Stage =
  | "idle"
  | "uploading"
  | "processing"
  | "done"
  | "error";

interface ProgressStage {
  label: string;
  progress: number;
}

const STAGES: Record<Stage, ProgressStage> = {
  idle:       { label: "",                               progress: 0   },
  uploading:  { label: "Enviando imagens...",            progress: 20  },
  processing: { label: "Gerando o look com IA...",       progress: 60  },
  done:       { label: "Pronto! Redirecionando...",       progress: 100 },
  error:      { label: "Algo deu errado.",               progress: 0   },
};

// Progress ticks while we wait for Replicate (processing stage)
// Advances from 60 → 95 slowly so it never feels stuck
const POLL_INTERVAL_MS = 2500;
const PROGRESS_TICK = 3; // % per poll tick
const PROGRESS_CAP = 95;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

function useImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Use JPG, PNG ou WEBP.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `Arquivo muito grande. Maximo ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const clear = useCallback(() => {
    setFile((prev) => { if (prev) URL.revokeObjectURL(URL.createObjectURL(prev)); return null; });
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setError(null);
  }, []);

  return { file, preview, dragging, setDragging, error, handleFile, clear };
}

// ─── Upload Card ─────────────────────────────────────────────────────────────

interface UploadCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  preview: string | null;
  dragging: boolean;
  error: string | null;
  onFile: (f: File) => void;
  onDragChange: (d: boolean) => void;
  onClear: () => void;
}

function UploadCard({
  icon, title, subtitle, gradient, preview, dragging, error,
  onFile, onDragChange, onClear,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`upload-zone relative bg-white rounded-3xl shadow-sm border-2 transition-all overflow-hidden
        ${dragging ? "border-rose-400 scale-[1.01] shadow-md shadow-rose-100" : "border-transparent"}`}
      onDragOver={(e) => { e.preventDefault(); onDragChange(true); }}
      onDragLeave={() => onDragChange(false)}
      onDrop={(e) => { e.preventDefault(); onDragChange(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
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
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
              <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Toque para enviar</p>
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

// ─── Clothes Card ─────────────────────────────────────────────────────────────

interface ClothesCardProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  uploadProps: ReturnType<typeof useImageUpload>;
  url: string;
  onUrlChange: (v: string) => void;
  urlError: string | null;
}

function ClothesCard({ tab, onTabChange, uploadProps, url, onUrlChange, urlError }: ClothesCardProps) {
  const { preview, dragging, setDragging, error, handleFile, clear } = uploadProps;

  return (
    <div className="upload-zone bg-white rounded-3xl shadow-sm border-2 border-transparent overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-rose-400" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-white">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">A Roupa</p>
            <p className="text-xs text-gray-400">Envie ou cole o link do produto</p>
          </div>
          {(preview || url) && (
            <button onClick={() => { clear(); onUrlChange(""); }} className="ml-auto w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
          {(["upload", "url"] as Tab[]).map((t) => (
            <button key={t} onClick={() => onTabChange(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
              {t === "upload" ? <><ImageIcon className="w-3.5 h-3.5" /> Imagem</> : <><LinkIcon className="w-3.5 h-3.5" /> Link do site</>}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview roupa" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <label
              className={`block w-full aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer group
                ${dragging ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Upload className="w-6 h-6 text-gray-300 group-hover:text-amber-400 transition-colors" />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">Toque para enviar</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">ou arraste aqui</p>
                </div>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </label>
          )
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="url" value={url} onChange={(e) => onUrlChange(e.target.value)}
                placeholder="https://renner.com.br/produto/..."
                className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:outline-none text-sm transition-colors placeholder:text-gray-300" />
              {url && (
                <button onClick={() => onUrlChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Renner", "C&A", "Zara", "Shein", "Riachuelo"].map((store) => (
                <span key={store} className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-medium">{store}</span>
              ))}
            </div>
            {url && !urlError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-700 truncate">{url}</p>
              </div>
            )}
            {urlError && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{urlError}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-red-500 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </div>
        )}
      </div>
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
            {stage === "processing" ? "Isso pode levar 30–60 segundos..." : "Aguarde um momento..."}
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
            Visualizacao sera exibida em breve
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TryOnInterface() {
  const router = useRouter();
  const userUpload = useImageUpload();
  const clothesUpload = useImageUpload();

  const [clothesTab, setClothesTab] = useState<Tab>("upload");
  const [clothesUrl, setClothesUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate URL on change
  useEffect(() => {
    if (!clothesUrl) { setUrlError(null); return; }
    try {
      const { protocol } = new URL(clothesUrl);
      setUrlError(["http:", "https:"].includes(protocol) ? null : "URL invalida. Inclua https://");
    } catch {
      setUrlError("URL invalida. Inclua https://");
    }
  }, [clothesUrl]);

  const hasUser = !!userUpload.preview;
  const hasClothes = clothesTab === "upload" ? !!clothesUpload.preview : !!clothesUrl && !urlError;
  const canGenerate = hasUser && hasClothes;

  const handleGenerate = async () => {
    if (!canGenerate || !userUpload.file) return;

    setErrorMsg(null);
    setStage("uploading");
    setProgress(STAGES.uploading.progress);

    // ── Build form data ────────────────────────────────────────────────────────
    const body = new FormData();
    body.append("human_img", userUpload.file);

    if (clothesTab === "upload" && clothesUpload.file) {
      body.append("garm_img", clothesUpload.file);
    } else {
      body.append("clothes_url", clothesUrl);
    }

    // ── Submit to /api/generate ────────────────────────────────────────────────
    let predictionId: string;
    try {
      const res = await fetch("/api/generate", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      predictionId = data.id;
    } catch (err) {
      setStage("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao iniciar geracao.");
      return;
    }

    // ── Poll /api/generate/[id] ────────────────────────────────────────────────
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
          // Pass the output URL via query param so result page can display it
          const outputUrl = encodeURIComponent(data.output as string);
          router.push(`/result/${predictionId}?output=${outputUrl}`);
          return;
        }

        if (data.status === "failed" || data.status === "canceled") {
          throw new Error(data.error ?? "Geracao falhou no Replicate.");
        }

        // Still running — tick progress and poll again
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
      {/* Loading overlay */}
      {(stage === "uploading" || stage === "processing" || stage === "done") && (
        <LoadingOverlay stage={stage} progress={progress} />
      )}

      {/* Error banner */}
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

      {/* Cards */}
      <div className="space-y-4 pb-28">
        <UploadCard
          icon={<User className="w-4 h-4" />}
          title="Sua Foto"
          subtitle="Foto de corpo inteiro ou busto"
          gradient="from-rose-500 to-pink-500"
          preview={userUpload.preview}
          dragging={userUpload.dragging}
          error={userUpload.error}
          onFile={userUpload.handleFile}
          onDragChange={userUpload.setDragging}
          onClear={userUpload.clear}
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <span className="text-xs font-bold text-gray-300 px-2">+</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <ClothesCard
          tab={clothesTab}
          onTabChange={(t) => { setClothesTab(t); clothesUpload.clear(); setClothesUrl(""); }}
          uploadProps={clothesUpload}
          url={clothesUrl}
          onUrlChange={setClothesUrl}
          urlError={urlError}
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
            {stage === "uploading" || stage === "processing" ? "Gerando..." : stage === "error" ? "Tentar novamente" : "Gerar Meu Look"}
          </button>

          <div className="flex justify-center gap-4 mt-2">
            <span className={`flex items-center gap-1 text-xs ${hasUser ? "text-green-500" : "text-gray-300"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasUser ? "bg-green-400" : "bg-gray-200"}`} />
              Sua foto
            </span>
            <span className={`flex items-center gap-1 text-xs ${hasClothes ? "text-green-500" : "text-gray-300"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasClothes ? "bg-green-400" : "bg-gray-200"}`} />
              A roupa
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
