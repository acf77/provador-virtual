import Link from "next/link";
import { ArrowLeft, Download, Sparkles } from "lucide-react";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ output?: string }>;
}) {
  const { id } = await params;
  const { output } = await searchParams;
  const outputUrl = output ? decodeURIComponent(output) : null;

  return (
    <div className="bg-app min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-rose-100">
        <div className="max-w-sm mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/try"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">Seu Look</span>
          </div>
          {outputUrl && (
            <a
              href={outputUrl}
              download={`look-${id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors"
            >
              <Download className="w-4 h-4 text-rose-500" />
            </a>
          )}
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6 space-y-4 animate-fade-in-up">
        {/* Result image */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500" />
          {outputUrl ? (
            <div className="relative aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={outputUrl}
                alt="Seu look gerado por IA"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center shadow-lg animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-400">Imagem nao disponivel</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {outputUrl && (
            <a
              href={outputUrl}
              download={`look-${id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Download className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Salvar imagem</span>
            </a>
          )}
          <Link
            href="/try"
            className={`flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow ${!outputUrl ? "col-span-2" : ""}`}
          >
            <Sparkles className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-medium text-gray-500">Tentar outra roupa</span>
          </Link>
        </div>

        {/* CTA */}
        <Link
          href="/try"
          className="block w-full py-4 rounded-2xl font-bold text-center text-white bg-gradient-to-r from-rose-500 to-violet-500 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-rose-200"
        >
          Experimentar outra roupa
        </Link>
      </main>
    </div>
  );
}
