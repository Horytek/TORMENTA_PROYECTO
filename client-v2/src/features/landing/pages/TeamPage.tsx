import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";
import { TEAM_LEADERS, TEAM_SPECIALISTS, type TeamMember } from "../data/landing.data";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="rounded-xl border border-border bg-card p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
        {initials(member.name)}
      </span>
      <h3 className="mt-3 text-[14px] font-semibold tracking-tight text-foreground">
        {member.name}
      </h3>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">
        {member.role}
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{member.body}</p>
    </article>
  );
}

export default function TeamPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Equipo
          </span>
          <h1 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            El equipo detrás de Horytek.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Un equipo pequeño construyendo el sistema que hubiéramos querido usar en nuestros
            propios negocios.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Liderazgo
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_LEADERS.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
            Especialistas
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_SPECIALISTS.map((m) => (
              <MemberCard key={m.name} member={m} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
