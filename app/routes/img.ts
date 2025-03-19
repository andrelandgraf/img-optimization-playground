import sharp from "sharp";
import { Readable } from "stream";
import { createReadStream, readFileSync } from "node:fs";
import type { Route } from "./+types/img";

function invariantResponse(condition: unknown, message: string, status: number): asserts condition {
  if (!condition) {
    throw new Response(message, { status, statusText: message });
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
  // Memory usage before processing
  const beforeBuffers = process.memoryUsage().arrayBuffers + process.memoryUsage().heapUsed;

  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);

  const src = params.get("src");
  const w = params.get("w");
  const h = params.get("h");
  const format = params.get("format");

  // Validate source path
  invariantResponse(src, "Source image URL is required", 400);
  
  // Validate width & height
  const width = w ? parseInt(w, 10) : null;
  const height = h ? parseInt(h, 10) : null;
  invariantResponse(width === null || !isNaN(width), "Width must be unset or a positive number", 400);
  invariantResponse(height === null || !isNaN(height), "Height must be unset or a positive number", 400);
  
  // Validate format if provided
  invariantResponse(format === null || format === "webp" || format === "avif", "Format must be one of: webp, avif", 400);

  const fsPath = "./public" + src;
  let buffer;
  
  try {
    buffer = await readFileSync(fsPath);
  } catch (error) {
    return new Response(`Image file not found: ${src}`, { status: 404 });
  }

  if(!format && !width && !height) {
    const afterBuffers = process.memoryUsage().arrayBuffers + process.memoryUsage().heapUsed;

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "X-Memory-Usage": `${afterBuffers - beforeBuffers} bytes`,
      },
    });
  }

  // --- Image processing starts here ---

  const pipeline = sharp(buffer);

  // Resize if width & height are provided
  if (width && height) {
    pipeline.resize(width, height);
  }

  // Apply format conversion if specified
  if (format) {
    pipeline.toFormat(format);
  }
  
  const processedBuffer = await pipeline.toBuffer();


  // --- Image processing ends here ---

  const afterBuffers = process.memoryUsage().arrayBuffers + process.memoryUsage().heapUsed;
  return new Response(processedBuffer, {
    headers: {
    //   "Content-Type": "image/png",
    //   "Content-Length": processedBuffer.length.toString(),
      "X-Memory-Usage": `${afterBuffers - beforeBuffers} bytes`,
    },
  });
  } catch (error: unknown) {
    console.error(error);
    if(error instanceof Response) {
      return error;
    }
    return new Response(`Error processing image: ${error}`, { status: 500 });
  }
}