// Reads a .tgz in the browser with nothing but the platform: DecompressionStream gunzips it and a tar
// header is a fixed 512 bytes. Also reads a pdf's title, so a dropped book names itself.

export interface TarFile {
  name: string;
  size: number;
  /** where the file's bytes start in the unpacked tar */
  start: number;
}

export interface Bundle {
  bytes: Uint8Array;
  files: TarFile[];
}

const utf8 = new TextDecoder();

function cstring(b: Uint8Array, from: number, len: number): string {
  let end = from;
  const max = from + len;
  while (end < max && b[end] !== 0) end++;
  return utf8.decode(b.subarray(from, end));
}

const octal = (b: Uint8Array, from: number, len: number) => parseInt(cstring(b, from, len).trim() || "0", 8);

/** pax extended headers: "<length> <key>=<value>\n" records, which carry paths too long for the plain header */
function paxRecords(b: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  let p = 0;
  while (p < b.length) {
    let space = p;
    while (space < b.length && b[space] !== 0x20) space++;
    const length = parseInt(utf8.decode(b.subarray(p, space)), 10);
    if (!length) break;
    const record = utf8.decode(b.subarray(space + 1, p + length - 1));
    const eq = record.indexOf("=");
    if (eq > 0) out[record.slice(0, eq)] = record.slice(eq + 1);
    p += length;
  }
  return out;
}

const isZeroBlock = (b: Uint8Array, at: number) => {
  for (let i = 0; i < 512; i++) if (b[at + i] !== 0) return false;
  return true;
};

/** the regular files of an unpacked tar, in order */
export function listTar(bytes: Uint8Array): TarFile[] {
  const files: TarFile[] = [];
  let pos = 0;
  let pax: Record<string, string> = {};
  let longName: string | null = null;

  while (pos + 512 <= bytes.length && !isZeroBlock(bytes, pos)) {
    const type = bytes[pos + 156] ? String.fromCharCode(bytes[pos + 156]) : "0";
    let size = octal(bytes, pos + 124, 12);
    let name = cstring(bytes, pos, 100);
    if (cstring(bytes, pos + 257, 5) === "ustar") {
      const prefix = cstring(bytes, pos + 345, 155);
      if (prefix) name = `${prefix}/${name}`;
    }
    const body = pos + 512;

    if (type === "x") pax = paxRecords(bytes.subarray(body, body + size));
    else if (type === "L") longName = cstring(bytes, body, size);
    else if (type !== "g") {
      if (pax.path) name = pax.path;
      else if (longName) name = longName;
      if (pax.size) size = Number(pax.size);
      if (type === "0" || type === "7") files.push({ name: name.replace(/^\.\//, ""), size, start: body });
      pax = {};
      longName = null;
    }
    pos = body + Math.ceil(size / 512) * 512;
  }
  return files;
}

/** a Blob streams through the gunzip, so the compressed bytes are never copied into script memory */
export async function readTgz(file: Blob): Promise<Bundle> {
  const stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return { bytes, files: listTar(bytes) };
}

export const entryBytes = (b: Bundle, f: TarFile): Uint8Array => b.bytes.subarray(f.start, f.start + f.size);

export interface Summary {
  count: number;
  unpacked: number;
  /** the biggest pdf inside, which is the book when a bundle is all that was dropped */
  pdf?: TarFile;
}

export function summarize(files: TarFile[]): Summary {
  const pdfs = files.filter((f) => /\.pdf$/i.test(f.name)).sort((a, b) => b.size - a.size);
  return { count: files.length, unpacked: files.reduce((n, f) => n + f.size, 0), pdf: pdfs[0] };
}

// ------------------------------------------------------------------------ pdf

function pdfString(raw: string): string {
  let bytes: number[];
  if (raw.startsWith("<")) {
    bytes = (raw.slice(1, -1).replace(/\s+/g, "").match(/../g) ?? []).map((h) => parseInt(h, 16));
  } else {
    bytes = [];
    const body = raw.slice(1, -1);
    const escapes: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12 };
    for (let i = 0; i < body.length; i++) {
      const c = body[i];
      if (c !== "\\") { bytes.push(body.charCodeAt(i) & 0xff); continue; }
      const next = body[++i];
      const oct = /^[0-7]{1,3}/.exec(body.slice(i, i + 3));
      if (oct) { bytes.push(parseInt(oct[0], 8) & 0xff); i += oct[0].length - 1; }
      else if (next in escapes) bytes.push(escapes[next]);
      else if (next !== "\n" && next !== "\r") bytes.push(next.charCodeAt(0) & 0xff);
    }
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(Uint8Array.from(bytes.slice(2)));
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(Uint8Array.from(bytes.slice(2)));
  return String.fromCharCode(...bytes);
}

const TITLE = /\/Title\s*(\((?:\\[\s\S]|[^\\)])*\)|<[0-9A-Fa-f\s]*>)/;
const latin1 = new TextDecoder("latin1");

/** pdf streams are zlib, which is what the "deflate" format of DecompressionStream reads */
async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** the text of object `num`: a plain one, or one packed inside a compressed object stream (what newer writers do) */
async function pdfObject(bytes: Uint8Array, text: string, num: number): Promise<string | null> {
  const plain = [...text.matchAll(new RegExp(`(?:^|[\\r\\n ])${num}\\s+\\d+\\s+obj\\b([\\s\\S]*?)endobj`, "g"))];
  if (plain.length) return plain[plain.length - 1][1];

  for (const m of text.matchAll(/\/Type\s*\/ObjStm/g)) {
    const objAt = text.lastIndexOf(" obj", m.index);
    const streamAt = text.indexOf("stream", m.index);
    if (objAt < 0 || streamAt < 0) continue;
    const dict = text.slice(objAt, streamAt);
    const n = Number(/\/N\s+(\d+)/.exec(dict)?.[1]);
    const first = Number(/\/First\s+(\d+)/.exec(dict)?.[1]);
    if (!n || !first) continue;
    let start = streamAt + 6;
    if (text[start] === "\r") start++;
    if (text[start] === "\n") start++;
    const length = /\/Length\s+(\d+)(\s+\d+\s+R)?/.exec(dict);
    const end = length && !length[2] ? start + Number(length[1]) : text.indexOf("endstream", start);
    let data: Uint8Array;
    try { data = await inflate(bytes.subarray(start, end)); } catch { continue; }
    const head = latin1.decode(data.subarray(0, first)).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) {
      if (head[2 * i] !== num) continue;
      const to = i + 1 < n ? first + head[2 * i + 3] : data.length;
      return latin1.decode(data.subarray(first + head[2 * i + 1], to));
    }
  }
  return null;
}

/**
 * The title in a pdf's document info, or null. It follows the file's own /Info reference, because
 * a book also has a /Title on every bookmark and the last one in the file is not the document's.
 */
export async function pdfTitle(bytes: Uint8Array): Promise<string | null> {
  try {
    const text = latin1.decode(bytes);
    const refs = [...text.matchAll(/\/Info\s+(\d+)\s+\d+\s+R/g)];
    const ref = refs[refs.length - 1];
    if (!ref) return null;
    const info = await pdfObject(bytes, text, Number(ref[1]));
    const raw = info && TITLE.exec(info)?.[1];
    return raw ? pdfString(raw).replace(/\s+/g, " ").trim() || null : null;
  } catch {
    return null;
  }
}
