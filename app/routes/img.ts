import { readFileSync } from "node:fs";
import type { Route } from "./+types/img";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);

  const src = params.get("src");
  const width = params.get("w");
  const height = params.get("h");
  const format = params.get("format");

  if (!src) {
    return new Response("Source image URL is required", { status: 400 });
  }

  const fsPath = "./public" + src;
  const buffer = await readFileSync(fsPath);

  return new Response(buffer, {
    headers: { "Content-Type": "image/png" },
  });
}