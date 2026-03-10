import Link from "next/link";
import { Sparkles, ArrowLeft, ShirtIcon } from "lucide-react";
import TryOnInterface from "@/components/TryOnInterface";

export const metadata = {
  title: "Provador Virtual — Experimente agora",
  description: "Veja como qualquer roupa fica em voce com IA",
};

export default function TryPage() {
  return (
    <div className="bg-app min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-rose-100">
        <div className="max-w-sm mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">Provador Virtual</span>
          </div>
          <Link
            href="/wardrobe"
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600 bg-violet-50 hover:bg-violet-100 px-2.5 py-1.5 rounded-full transition-colors"
          >
            <ShirtIcon className="w-3.5 h-3.5" />
            Guarda-roupa
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-sm mx-auto px-4 pt-6 pb-4">
        {/* Intro text */}
        <div className="mb-5 animate-fade-in-up">
          <h1 className="text-xl font-bold text-gray-900">
            Monte seu look
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Envie as duas fotos e a IA cuida do resto.
          </p>
        </div>

        {/* Interface component */}
        <div className="animate-fade-in-up-delay">
          <TryOnInterface />
        </div>
      </main>
    </div>
  );
}
