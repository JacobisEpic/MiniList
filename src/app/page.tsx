"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/notion";

/** local YYYY-MM-DD in user's timezone */
function toLocalYMD(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

type UiItem = {
  id: string;
  title: string;
  uiDone: boolean; // UI state mirrors server "done" but we update optimistically
  order: number;   // stable original order for sorting
};

export default function Home() {
  const today = useMemo(() => toLocalYMD(), []);
  const [items, setItems] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ tasks: Task[] }>(`/api/tasks?date=${today}`);
        const seeded: UiItem[] = data.tasks.map((t, i) => ({
          id: t.id,
          title: t.title,
          uiDone: !!t.done,
          order: i,
        }));
        setItems(sortForView(seeded));
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, [today]);

  function sortForView(list: UiItem[]) {
    // Incomplete first (original order), then completed (original order)
    return [...list].sort((a, b) => {
      if (a.uiDone === b.uiDone) return a.order - b.order;
      return a.uiDone ? 1 : -1;
    });
  }

  async function toggleDone(it: UiItem) {
    // optimistic UI update: flip local state + reorder
    const prev = items;
    const next = sortForView(
      items.map((x) => (x.id === it.id ? { ...x, uiDone: !x.uiDone } : x))
    );
    setItems(next);

    try {
      // persist to Notion (server will update checkbox property)
      await api<{ task: Task }>("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id: it.id, done: !it.uiDone }),
      });
      // no-op: we already updated UI
    } catch (e: any) {
      // rollback on error
      setItems(prev);
      setErr(
        typeof e === "string"
          ? e
          : e?.message ?? "Failed to update task in Notion"
      );
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No tasks due today.</p>
      ) : (
        <ul className="select-none">
          {items.map((it) => (
            <li key={it.id} className="mb-2 last:mb-0">
              <button
                onClick={() => toggleDone(it)}
                className={[
                  "text-left w-full leading-7 transition-colors",
                  it.uiDone
                    ? "line-through text-gray-400"
                    : "text-black font-medium",
                ].join(" ")}
                aria-pressed={it.uiDone}
              >
                {it.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
