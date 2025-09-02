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
  uiDone: boolean; // mirrors server, updated optimistically
  order: number;   // stable initial order
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
    // Incomplete first (keep original order), then completed (keep original order)
    return [...list].sort((a, b) => {
      if (a.uiDone === b.uiDone) return a.order - b.order;
      return a.uiDone ? 1 : -1;
    });
  }

  async function toggleDone(it: UiItem) {
    const prev = items;
    const next = sortForView(
      items.map((x) => (x.id === it.id ? { ...x, uiDone: !x.uiDone } : x))
    );
    setItems(next); // optimistic UI

    try {
      await api<{ task: Task }>("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id: it.id, done: !it.uiDone }),
      });
    } catch (e: any) {
      setItems(prev); // rollback
      setErr(typeof e === "string" ? e : e?.message ?? "Failed to update task");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {err && <p className="text-center text-sm text-red-600 mb-3">{err}</p>}

        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">No tasks due today.</p>
        ) : (
          <ul className="select-none text-center">
            {items.map((it) => (
              <li key={it.id} className="mb-2 last:mb-0">
                <button
                  onClick={() => toggleDone(it)}
                  className="block w-full px-2 py-1"
                  aria-pressed={it.uiDone}
                  data-done={it.uiDone ? "true" : "false"}
                >
                  {/* Strike-through on the span to avoid button resets */}
                  <span
                    className={
                      it.uiDone
                        ? "leading-7 line-through decoration-gray-400 decoration-2 text-gray-400"
                        : "leading-7 font-medium text-gray-900"
                    }
                  >
                    {it.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
