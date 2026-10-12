import type { ReactNode } from "react";

const HERO = "https://upload.wikimedia.org/wikipedia/commons/9/99/Tea_plantations_in_Munnar.jpg";

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 bg-[#f6f3ee]">
      <section className="relative h-56 overflow-hidden sm:h-72">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-[#f6f3ee]" />
      </section>
      <div className="relative z-10 mx-auto -mt-20 w-full max-w-3xl space-y-5 px-4 pb-16 sm:px-6">
        <div className="rounded-[28px] bg-[#f7f4ef]/95 px-6 py-5 shadow-[0_16px_50px_-28px_rgba(20,40,20,0.45)] backdrop-blur">
          <h1 className="text-3xl font-semibold tracking-tight text-[#163226]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
