import React, { useEffect, useMemo, useState } from "react";

// Biodigestor Maintenance Scheduler
// - Botão abre um modal
// - Usuário escolhe dia e hora (input datetime-local)
// - Ao confirmar, exibe um aviso flutuante fixo na tela com a data agendada
// - Persiste no localStorage para não perder ao recarregar
// - Sem dependências externas; estilizado com Tailwind

export default function BiodigestorMaintenanceScheduler() {
  const STORAGE_KEY = "biodigestor_maintenance_schedule";

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(""); // datetime-local string
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  // Carregar do storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) setScheduledAt(d);
      }
    } catch {}
  }, []);

  // Prepara valor inicial do input ao abrir o modal
  useEffect(() => {
    if (open) {
      const base = scheduledAt ?? addHours(new Date(), 1);
      setValue(toDatetimeLocal(base));
    }
  }, [open]);

  function handleConfirm() {
    if (!value) return;
    const date = new Date(value);
    if (isNaN(date.getTime())) return;
    setScheduledAt(date);
    try {
      localStorage.setItem(STORAGE_KEY, date.toISOString());
    } catch {}
    setOpen(false);
  }

  function handleClear() {
    setScheduledAt(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  const formatted = useMemo(() => (scheduledAt ? formatDatePtBR(scheduledAt) : null), [scheduledAt]);

  return (
    <div className="relative isolate min-h-[200px] w-full">
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarIcon className="h-5 w-5" />
        Agendar manutenção
      </button>

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scheduler-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="scheduler-title" className="text-xl font-semibold text-slate-900">
                  Agendar manutenção do biodigestor
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Escolha o dia e a hora. O agendamento ficará visível na tela como um lembrete flutuante.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Dia e hora
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification */}
      {formatted && (
        <div className="fixed bottom-4 right-4 z-40 max-w-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="mt-0.5 rounded-xl bg-emerald-600/10 p-2 text-emerald-700">
              <BellIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Manutenção agendada</p>
              <p className="truncate text-sm text-slate-700" title={formatted}>
                {formatted}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setOpen(true)}
                  className="rounded-lg px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  Editar
                </button>
                <button
                  onClick={handleClear}
                  className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dica/estado vazio */}
      {!formatted && (
        <p className="mt-4 text-sm text-slate-600">
          Nenhuma manutenção agendada ainda. Clique em <span className="font-medium text-slate-900">“Agendar manutenção”</span> para definir dia e hora.
        </p>
      )}
    </div>
  );
}

// Helpers
function addHours(d: Date, hours: number) {
  const r = new Date(d);
  r.setHours(r.getHours() + hours);
  return r;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Converte Date -> string aceita por input datetime-local (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(date: Date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function formatDatePtBR(date: Date) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString("pt-BR");
  }
}

// Icons
function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v1h20V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1Zm14 8H3v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V10Z" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.225 4.811a1 1 0 1 0-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 0 0 1.414 1.414L12 13.414l5.775 5.775a1 1 0 0 0 1.414-1.414L13.414 12l5.775-5.775a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a6 6 0 0 0-6 6v3.382l-.894 2.236A2 2 0 0 0 7 16h10a2 2 0 0 0 1.894-2.382L18 11.382V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z" />
    </svg>
  );
}
