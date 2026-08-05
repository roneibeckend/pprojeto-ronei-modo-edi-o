import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/platform/Shell";
import { student, courses } from "@/lib/platform-data";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Espetinho na Veia" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div>
      <PageHeader title="Meu perfil" subtitle="Gerencie seus dados e preferências." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="glass rounded-2xl p-6 text-center">
          <img src={student.avatar} alt={student.name} className="mx-auto h-28 w-28 rounded-full ring-4 ring-primary/30" />
          <h3 className="mt-4 font-display text-2xl font-bold">{student.name}</h3>
          <p className="text-sm text-muted-foreground">{student.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">Aluno desde {student.since}</p>
          <button className="btn-ghost-fire mt-6 w-full text-sm">Trocar foto</button>
        </section>

        <section className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold">Dados pessoais</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" defaultValue={student.name} />
              <Field label="E-mail" defaultValue={student.email} type="email" />
              <Field label="Telefone" defaultValue={student.phone} />
              <Field label="Nova senha" type="password" placeholder="••••••••" />
            </div>
            <button className="btn-fire mt-6 text-sm">Salvar alterações</button>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold">Cursos adquiridos</h3>
            <ul className="mt-3 space-y-2">
              {courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 p-3 text-sm">
                  <span>{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.progress}% concluído</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold">Preferências de notificação</h3>
            <div className="mt-4 space-y-3 text-sm">
              {["Novos cursos e materiais", "Lembretes de estudo", "Novidades e promoções"].map((l) => (
                <label key={l} className="flex items-center justify-between rounded-xl border border-white/5 p-3">
                  <span>{l}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[oklch(0.63_0.24_27)]" />
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input {...rest} className="w-full rounded-xl border border-white/10 bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  );
}
