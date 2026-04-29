import { cn } from "../lib/utils";
import { statusBadge, statusBadgeDefault } from "../lib/status-colors";

const STATUS_LABELS_PT_BR: Record<string, string> = {
  // run / agent / task statuses
  active: "ativo",
  inactive: "inativo",
  idle: "ocioso",
  running: "rodando",
  paused: "pausado",
  archived: "arquivado",
  planned: "planejado",
  achieved: "alcançado",
  completed: "concluído",
  done: "concluído",
  failed: "falhou",
  timed_out: "expirou",
  succeeded: "bem-sucedida",
  success: "sucesso",
  error: "erro",
  cancelled: "cancelado",
  canceled: "cancelado",
  skipped: "pulado",
  pending: "pendente",
  pending_approval: "aguardando aprovação",
  in_progress: "em andamento",
  in_review: "em revisão",
  blocked: "bloqueado",
  todo: "a fazer",
  backlog: "pendente",
  open: "aberta",
  closed: "fechada",
  ready: "pronto",
  queued: "na fila",
  starting: "iniciando",
  stopping: "parando",
  cleanup_failed: "falha na limpeza",
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS_PT_BR[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        statusBadge[status] ?? statusBadgeDefault
      )}
    >
      {label}
    </span>
  );
}
