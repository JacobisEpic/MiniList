// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { notion, NOTION_DB, mapPageToTask, ensureSchema } from "@/lib/notion";

export const dynamic = "force-dynamic";

// GET /api/tasks?date=YYYY-MM-DD → list tasks due on that day
export async function GET(req: NextRequest) {
  try {
    const P = await ensureSchema();
    const url = new URL(req.url);
    const day = url.searchParams.get("date") || ""; // YYYY-MM-DD (local from client)

    const query: any = { database_id: NOTION_DB };

    if (P.DUE && day) {
      query.filter = {
        property: P.DUE,
        date: { equals: day }, // show tasks due exactly on this day
      };
      // Optional: add sorting (by time if you use time on the date)
      query.sorts = [{ property: P.DUE, direction: "ascending" }];
    }

    const res = await notion.databases.query(query);

    return NextResponse.json({
      tasks: res.results.map((pg: any) => mapPageToTask(pg, P)),
      nextCursor: res.next_cursor,
      hasMore: res.has_more,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/tasks → create task
// body: { title: string, due?: string(YYYY-MM-DD) }
export async function POST(req: NextRequest) {
  try {
    const P = await ensureSchema();
    const { title, due } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const properties: Record<string, any> = {
      [P.NAME]: { title: [{ text: { content: title } }] },
    };
    if (P.DONE !== undefined) properties[P.DONE] = { checkbox: false };
    if (P.DUE && typeof due === "string") properties[P.DUE] = { date: { start: due } };

    const created = await notion.pages.create({
      parent: { database_id: NOTION_DB },
      properties,
    });

    return NextResponse.json({ task: mapPageToTask(created, P) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to create" }, { status: 500 });
  }
}

// PATCH /api/tasks → update (toggle done, change title/due)
// body: { id: string, title?: string, done?: boolean, due?: string|null }
export async function PATCH(req: NextRequest) {
  try {
    const P = await ensureSchema();
    const { id, title, done, due } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const properties: Record<string, any> = {};
    if (typeof title === "string") properties[P.NAME] = { title: [{ text: { content: title } }] };

    if (typeof done === "boolean") {
      if (P.DONE === undefined) {
        return NextResponse.json(
          { error: "No checkbox property found in your database." },
          { status: 400 }
        );
      }
      properties[P.DONE] = { checkbox: done };
    }

    if (due === null && P.DUE) properties[P.DUE] = { date: null };
    if (typeof due === "string" && P.DUE) properties[P.DUE] = { date: { start: due } };

    const updated = await notion.pages.update({ page_id: id, properties });
    return NextResponse.json({ task: mapPageToTask(updated, P) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/tasks → archive by id
// body: { id: string }
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await notion.pages.update({ page_id: id, archived: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to archive" }, { status: 500 });
  }
}
