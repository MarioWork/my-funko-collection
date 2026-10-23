// Reads one file out of an .xlsx (a zip) in tests, so a test can look at a sheet's XML. Test-only, never built.
import { inflateRawSync } from 'node:zlib';

const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const STORED = 0;

// Walks the zip's central directory (it always has the real sizes), then reads that entry's data.
export function readXlsxFile(xlsx: Buffer, path: string): string | undefined {
  let offset = xlsx.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const entryCount = xlsx.readUInt16LE(offset + 10);
  offset = xlsx.readUInt32LE(offset + 16);

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (xlsx.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) return undefined;

    const method = xlsx.readUInt16LE(offset + 10);
    const compressedSize = xlsx.readUInt32LE(offset + 20);
    const nameLength = xlsx.readUInt16LE(offset + 28);
    const extraLength = xlsx.readUInt16LE(offset + 30);
    const commentLength = xlsx.readUInt16LE(offset + 32);
    const localHeader = xlsx.readUInt32LE(offset + 42);
    const name = xlsx.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (name === path) {
      const dataStart = localHeader + 30 + xlsx.readUInt16LE(localHeader + 26) + xlsx.readUInt16LE(localHeader + 28);
      const data = xlsx.subarray(dataStart, dataStart + compressedSize);

      return (method === STORED ? data : inflateRawSync(data)).toString('utf8');
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return undefined;
}
