import fs from "fs-extra";
import readline from "readline";
import path from "path";

export async function splitCSV(inputFilePath: string, linesPerChunk: number = 20000): Promise<string[]> {
  const chunkDir = path.join(process.cwd(), "src", "temp", "chunks");
  await fs.ensureDir(chunkDir);

  const chunks: string[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(inputFilePath),
    crlfDelay: Infinity,
  });

  let header: string | null = null;
  let count = 0;
  let chunkIndex = 1;

  let chunkPath = path.join(chunkDir, `${Date.now()}_chunk_${chunkIndex}.csv`);
  let writer = fs.createWriteStream(chunkPath);
  chunks.push(chunkPath);

  for await (const rawLine of rl) {
    // remove only trailing CR, not whitespace or commas
    const line = rawLine.replace(/\r$/, "");

    // skip true empty lines
    if (line === "") continue;

    if (header === null) {
      header = line;
      writer.write(header + "\n");
      continue;
    }

    writer.write(line + "\n");
    count++;

    if (count >= linesPerChunk) {
      writer.end();
      count = 0;

      chunkIndex++;
      chunkPath = path.join(chunkDir, `${Date.now()}_chunk_${chunkIndex}.csv`);
      writer = fs.createWriteStream(chunkPath);
      chunks.push(chunkPath);

      writer.write(header + "\n");
    }
  }

  writer.end();

  await fs.remove(inputFilePath); // delete original upload

  return chunks;
}
