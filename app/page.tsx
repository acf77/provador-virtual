import Link from "next/link";
import { Sparkles, Upload, Zap, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-app flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-rose-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Provador</span>
          </div>
          <Link
            href="/try"
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            Experimentar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-sm mx-auto space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            Powered by IA
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Veja como a{" "}
            <span className="bg-gradient-to-r from-rose-500 via-amber-500 to-violet-500 bg-clip-text text-transparent">
              roupa fica
            </span>{" "}
            em voce
          </h1>

          {/* Subtext */}
          <p className="text-gray-500 text-base leading-relaxed">
            Foto sua, link da Renner ou C&amp;A — e em segundos voce ve o look
            completo. Sem precisar sair de casa.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-3 pt-2 animate-fade-in-up-delay">
            {[
              { icon: Upload, label: "Envie sua foto", color: "rose" },
              { icon: ShoppingBag, label: "Escolha a roupa", color: "amber" },
              { icon: Sparkles, label: "Veja o resultado", color: "violet" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    color === "rose"
                      ? "bg-rose-100 text-rose-500"
                      : color === "amber"
                      ? "bg-amber-100 text-amber-500"
                      : "bg-violet-100 text-violet-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600 leading-tight text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/try"
            className="block w-full py-4 px-6 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-rose-500 via-rose-500 to-violet-500 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-rose-200 pulse-cta"
          >
            Experimentar agora — gratis
          </Link>

          <p className="text-xs text-gray-400">
            Nenhum cadastro necessario. Funciona direto no navegador.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        Provador Virtual &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
