/**
 * Security update checker (report-only).
 *
 * Verifica atualizações de segurança pendentes do projeto:
 *  1. Vulnerabilidades conhecidas nas dependências npm (npm audit --json)
 *  2. Pacotes desatualizados relevantes para segurança (npm outdated --json)
 *  3. Ambiente de execução (versões de Node/Bun em uso)
 *
 * NUNCA aplica atualizações — apenas identifica e reporta.
 *
 * Uso:
 *   bun run security:check            relatório legível
 *   bun run security:check -- --json  saída JSON (para CI)
 *   bun run security:check -- --fail-on=high   exit 1 se houver >= high
 */

import { execFile } from 'node:child_process';

type Severity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

const SEVERITY_ORDER: Severity[] = ['info', 'low', 'moderate', 'high', 'critical'];

interface Vulnerability {
  name: string;
  severity: Severity;
  installed: string | null;
  fixAvailable: string | null;
  via: string[];
}

interface OutdatedPackage {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  majorBehind: boolean;
}

interface Report {
  generatedAt: string;
  runtime: { node: string; bun: string | null };
  vulnerabilities: Vulnerability[];
  counts: Record<Severity, number>;
  outdated: OutdatedPackage[];
  highestSeverity: Severity | null;
}

function run(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error && typeof (error as { code?: unknown }).code === 'number' ? (error as { code: number }).code : 0;
      resolve({ stdout: stdout ?? '', stderr: stderr ?? '', code });
    });
  });
}

function safeJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeSeverity(value: unknown): Severity {
  return SEVERITY_ORDER.includes(value as Severity) ? (value as Severity) : 'info';
}

async function collectVulnerabilities(): Promise<Vulnerability[]> {
  // npm audit sai com código != 0 quando encontra vulnerabilidades: isso é esperado.
  const { stdout } = await run('npm', ['audit', '--json']);
  const parsed = safeJson<{
    vulnerabilities?: Record<
      string,
      {
        name?: string;
        severity?: string;
        via?: Array<string | { title?: string; name?: string }>;
        fixAvailable?: boolean | { name?: string; version?: string };
        range?: string;
      }
    >;
  }>(stdout);

  if (!parsed?.vulnerabilities) return [];

  return Object.values(parsed.vulnerabilities)
    .map((entry) => {
      const fix = entry.fixAvailable;
      return {
        name: entry.name ?? 'desconhecido',
        severity: normalizeSeverity(entry.severity),
        installed: entry.range ?? null,
        fixAvailable:
          typeof fix === 'object' && fix?.version
            ? `${fix.name ?? entry.name}@${fix.version}`
            : fix === true
              ? 'disponível via npm audit fix'
              : null,
        via: (entry.via ?? [])
          .map((v) => (typeof v === 'string' ? v : (v.title ?? v.name ?? '')))
          .filter(Boolean),
      } satisfies Vulnerability;
    })
    .sort((a, b) => SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity));
}

async function collectOutdated(): Promise<OutdatedPackage[]> {
  const { stdout } = await run('npm', ['outdated', '--json']);
  const parsed = safeJson<Record<string, { current?: string; wanted?: string; latest?: string }>>(stdout);
  if (!parsed) return [];

  return Object.entries(parsed)
    .filter(([, info]) => info.current && info.latest)
    .map(([name, info]) => {
      const currentMajor = Number.parseInt(String(info.current).replace(/^\D*/, ''), 10);
      const latestMajor = Number.parseInt(String(info.latest).replace(/^\D*/, ''), 10);
      return {
        name,
        current: info.current!,
        wanted: info.wanted ?? info.current!,
        latest: info.latest!,
        majorBehind: Number.isFinite(currentMajor) && Number.isFinite(latestMajor) && latestMajor > currentMajor,
      } satisfies OutdatedPackage;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function bunVersion(): Promise<string | null> {
  const { stdout, code } = await run('bun', ['--version']);
  return code === 0 && stdout.trim() ? stdout.trim() : null;
}

async function buildReport(): Promise<Report> {
  const [vulnerabilities, outdated, bun] = await Promise.all([
    collectVulnerabilities(),
    collectOutdated(),
    bunVersion(),
  ]);

  const counts = SEVERITY_ORDER.reduce(
    (acc, severity) => ({ ...acc, [severity]: vulnerabilities.filter((v) => v.severity === severity).length }),
    {} as Record<Severity, number>,
  );

  return {
    generatedAt: new Date().toISOString(),
    runtime: { node: process.version, bun },
    vulnerabilities,
    counts,
    outdated,
    highestSeverity: vulnerabilities[0]?.severity ?? null,
  };
}

function printReport(report: Report): void {
  const line = '─'.repeat(64);
  console.log(line);
  console.log('RELATÓRIO DE ATUALIZAÇÕES DE SEGURANÇA (somente leitura)');
  console.log(`Gerado em: ${report.generatedAt}`);
  console.log(`Runtime:   Node ${report.runtime.node}${report.runtime.bun ? ` | Bun ${report.runtime.bun}` : ''}`);
  console.log(line);

  console.log('\n1) Vulnerabilidades nas dependências');
  if (report.vulnerabilities.length === 0) {
    console.log('   Nenhuma vulnerabilidade conhecida encontrada.');
  } else {
    const summary = SEVERITY_ORDER.slice()
      .reverse()
      .filter((s) => report.counts[s] > 0)
      .map((s) => `${s}: ${report.counts[s]}`)
      .join(' | ');
    console.log(`   Resumo → ${summary}`);
    for (const vuln of report.vulnerabilities) {
      console.log(`\n   [${vuln.severity.toUpperCase()}] ${vuln.name}`);
      if (vuln.installed) console.log(`      Versões afetadas: ${vuln.installed}`);
      console.log(`      Correção:        ${vuln.fixAvailable ?? 'sem correção publicada'}`);
      if (vuln.via.length) console.log(`      Origem:          ${vuln.via.slice(0, 3).join('; ')}`);
    }
  }

  console.log('\n2) Pacotes desatualizados (atualização recomendada)');
  if (report.outdated.length === 0) {
    console.log('   Todos os pacotes estão nas versões desejadas.');
  } else {
    const majors = report.outdated.filter((p) => p.majorBehind);
    console.log(`   ${report.outdated.length} pacote(s) desatualizado(s), ${majors.length} com mudança de major.`);
    for (const pkg of report.outdated.slice(0, 30)) {
      console.log(
        `   - ${pkg.name}: ${pkg.current} → ${pkg.wanted}${pkg.latest !== pkg.wanted ? ` (latest ${pkg.latest})` : ''}${pkg.majorBehind ? '  [major]' : ''}`,
      );
    }
    if (report.outdated.length > 30) console.log(`   ... e ${report.outdated.length - 30} outro(s).`);
  }

  console.log(`\n${line}`);
  console.log('Nenhuma atualização foi aplicada. Revise e atualize manualmente quando apropriado.');
  console.log(line);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const failOnArg = args.find((a) => a.startsWith('--fail-on='));
  const failOn = failOnArg ? normalizeSeverity(failOnArg.split('=')[1]) : null;

  const report = await buildReport();

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  if (failOn && report.highestSeverity && SEVERITY_ORDER.indexOf(report.highestSeverity) >= SEVERITY_ORDER.indexOf(failOn)) {
    console.error(`\nFalha: severidade máxima encontrada (${report.highestSeverity}) >= limite (${failOn}).`);
    process.exit(1);
  }
}

void main();
