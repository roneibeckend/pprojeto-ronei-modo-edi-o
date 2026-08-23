import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Search, RefreshCw, ShieldAlert, Users, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { listEbookDownloadLogs } from "@/lib/ebook-download.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads de E-books · Admin" },
      { name: "description", content: "Auditoria dos downloads de e-books por aluno, data e ID." },
    ],
  }),
  component: AdminDownloadsPage,
});

const ORANGE = "#ff6a00";

function AdminDownloadsPage() {
  const fetchLogs = useServerFn(listEbookDownloadLogs);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ebook-download-logs", search, from, to],
    queryFn: () => fetchLogs({ data: { search, from, to } }),
  });

  const rows = data?.rows ?? [];

  function exportCsv() {
    if (!rows.length) {
      toast.error("Nenhum registro para exportar.");
      return;
    }
    const header = ["Data", "Aluno", "E-mail", "ID do Aluno", "E-book", "ID do E-book", "Aceite", "IP"];
    const lines = rows.map((r: any) =>
      [
        format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss"),
        r.student_name || "",
        r.student_email || "",
        r.user_id,
        r.ebook_title || "",
        r.ebook_id,
        r.accepted_terms ? "Sim" : "Não",
        r.ip_address || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = "\uFEFF" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `downloads-ebooks-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Download className="h-6 w-6" style={{ color: ORANGE }} />
            Downloads de E-books
          </h1>
          <p className="text-sm text-white/50">
            Auditoria de cada download com aceite de direitos autorais, aluno, data e ID.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="min-h-11">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={exportCsv} className="min-h-11" style={{ background: ORANGE, color: "#000" }}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Download className="h-5 w-5" style={{ color: ORANGE }} />
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Downloads</p>
              <p className="text-xl font-black">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5" style={{ color: ORANGE }} />
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Alunos distintos</p>
              <p className="text-xl font-black">{data?.unique_students ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5" style={{ color: ORANGE }} />
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40">Limite anti-abuso</p>
              <p className="text-sm font-bold">3 por e-book / 8 por dia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Busque por aluno, e-mail, ID ou e-book e filtre por período.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Aluno, e-mail, ID ou e-book"
              className="pl-9"
            />
          </div>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-white/50">Carregando registros...</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-white/50">Nenhum download registrado com os filtros atuais.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Aluno</th>
                    <th className="p-3">ID do Aluno</th>
                    <th className="p-3">E-book</th>
                    <th className="p-3">Aceite</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="whitespace-nowrap p-3 text-white/70">
                        {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{r.student_name || "—"}</p>
                        <p className="text-xs text-white/40">{r.student_email || "—"}</p>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-white/50">{r.user_id}</td>
                      <td className="p-3">
                        <p className="font-semibold">{r.ebook_title || "—"}</p>
                        <p className="font-mono text-[11px] text-white/40">{r.ebook_id}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-bold uppercase"
                          style={{ background: `${ORANGE}1a`, color: ORANGE }}
                        >
                          {r.accepted_terms ? "Registrado" : "Pendente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
