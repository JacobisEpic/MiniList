// src/lib/notion.ts
import { Client } from "@notionhq/client";

if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN missing");
if (!process.env.NOTION_DATABASE_ID) throw new Error("NOTION_DATABASE_ID missing");

export const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const NOTION_DB = process.env.NOTION_DATABASE_ID;

export type Task = {
  id: string;
  title: string;
  done: boolean;
  due: string | null; // YYYY-MM-DD or null
};

export type MiniListProps = {
  NAME: string;          // title prop name
  DONE?: string;         // checkbox prop name (may be "")
  DUE?: string;          // date prop name
};

let schemaCache: MiniListProps | null = null;

export async function ensureSchema(): Promise<MiniListProps> {
  if (schemaCache) return schemaCache;

  // Allow manual override via env if you ever want it
  const envName = process.env.NOTION_NAME_PROP;
  const envDone = process.env.NOTION_DONE_PROP;
  const envDue  = process.env.NOTION_DUE_PROP;

  const db = await notion.databases.retrieve({ database_id: NOTION_DB });
  const props: Record<string, any> = (db as any).properties || {};

  // find first property by type
  const findByType = (type: string) =>
    Object.keys(props).find((k) => props[k]?.type === type);

  const NAME = envName || findByType("title")!;
  const DONE = envDone ?? findByType("checkbox"); // may be undefined (or empty string)
  const DUE  = envDue  ?? findByType("date");

  if (!NAME) throw new Error("No title property found in the Notion database.");

  schemaCache = { NAME, DONE, DUE };
  return schemaCache;
}

export function mapPageToTask(page: any, P: MiniListProps): Task {
  const pr = page.properties ?? {};
  const title =
    (pr[P.NAME]?.title?.[0]?.plain_text as string) ??
    (pr[P.NAME]?.rich_text?.[0]?.plain_text as string) ??
    "";
  const done = P.DONE !== undefined && typeof pr[P.DONE]?.checkbox === "boolean"
    ? Boolean(pr[P.DONE]?.checkbox)
    : false;
  const due = P.DUE ? (pr[P.DUE]?.date?.start ?? null) : null;

  return { id: page.id as string, title, done, due };
}
