// import fs from "fs-extra";
// import path from "path";
// import { parser } from "stream-json";
// import { streamArray } from "stream-json/streamers/StreamArray";

// export async function splitJSONArray(
//   inputFilePath: string,
//   itemsPerChunk: number = 20000
// ): Promise<string[]> {
//   const chunkDir = path.join(process.cwd(), "src", "temp", "json-chunks");
//   await fs.ensureDir(chunkDir);

//   const chunks: string[] = [];

//   // Prepare JSON stream parser
//   const pipeline = fs
//     .createReadStream(inputFilePath)
//     .pipe(parser())
//     .pipe(streamArray());

//   let chunkIndex = 1;
//   let itemCount = 0;

//   // Create first JSON file
//   let outPath = path.join(chunkDir, `${Date.now()}_chunk_${chunkIndex}.json`);
//   let out = fs.createWriteStream(outPath);

//   // Start JSON array for first file
//   out.write("[");
//   chunks.push(outPath);

//   for await (const { value } of pipeline) {
//     // Write objects separated by ,
//     if (itemCount > 0) out.write(",");

//     out.write(JSON.stringify(value));
//     itemCount++;

//     if (itemCount >= itemsPerChunk) {
//       // Close current chunk
//       out.write("]");
//       out.end();

//       // Prepare next chunk
//       chunkIndex++;
//       itemCount = 0;

//       outPath = path.join(chunkDir, `${Date.now()}_chunk_${chunkIndex}.json`);
//       out = fs.createWriteStream(outPath);
//       out.write("[");
//       chunks.push(outPath);
//     }
//   }

//   // Close last file
//   out.write("]");
//   out.end();

//   return chunks;
// }
