/**
 * Format extractors — dependency-free, offline, no shelling out.
 *
 * Design constraint that shaped this file: the whole system must run on a
 * 2015 laptop with no build toolchain and no network. A PDF extractor that
 * pulls in 40MB of wasm would break the local-first promise for exactly the
 * people the promise is for. So these are small, lossy where necessary, and
 * explicitly honest about what they could not read.
 *
 * Nothing here guesses. If a PDF is a scan, the extractor says "no text layer
 * — needs OCR" rather than emitting plausible nonsense.
 */

import { inflateSync } from 'node:zlib';

export interface ExtractResult {
  text: string;
  /** What kind of thing we actually read. */
  format: 'text' | 'markdown' | 'html' | 'pdf' | 'docx' | 'json' | 'unknown';
  /** Pages/sections that yielded no text. Silence here is a lie of omission. */
  degraded: string[];
  meta: {
    pages?: number;
    wordCount: number;
    /** True when text came from a binary format we had to decode ourselves. */
    decodedBinary?: boolean;
  };
}

const MAX_BYTES = 25 * 1024 * 1024;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function extractText(buf: Buffer, filenameOrUrl = ''): ExtractResult {
  const lower = filenameOrUrl.toLowerCase();
  if (buf.length > MAX_BYTES) {
    throw new Error(
      `Input is ${(buf.length / 1e6).toFixed(1)}MB, above the 25MB local limit. Split it, or pass the text directly.`,
    );
  }

  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return extractPdf(buf);
  if (buf.subarray(0, 2).toString('latin1') === 'PK') {
    if (lower.endsWith('.docx')) return extractDocx(buf);
    return { ...plain(buf.toString('utf8')), format: 'unknown', degraded: ['opened a zip container that is not .docx; extracted raw bytes only'] };
  }

  const asText = buf.toString('utf8');
  if (lower.endsWith('.json') || /^\s*[[{]/.test(asText.slice(0, 64))) {
    return { ...plain(asText), format: 'json' };
  }
  if (lower.endsWith('.html') || lower.endsWith('.htm') || /^\s*<(!doctype|html)/i.test(asText)) {
    return { text: htmlToReadable(asText), format: 'html', degraded: [], meta: { wordCount: countWords(htmlToReadable(asText)) } };
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || /^#{1,3} /m.test(asText.slice(0, 400))) {
    return { ...plain(asText), format: 'markdown' };
  }
  return { ...plain(asText), format: 'text' };
}

function plain(text: string): ExtractResult {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\u0000/g, '');
  return { text: cleaned, format: 'text', degraded: [], meta: { wordCount: countWords(cleaned) } };
}

/** HTML → readable text. Not a parser; a reader. */
export function htmlToReadable(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h1[^>]*>/gi, '\n# ')
    .replace(/<h2[^>]*>/gi, '\n## ')
    .replace(/<h3[^>]*>/gi, '\n### ')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ');

  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * PDF text extraction: streams → FlateDecode → text operators.
 *
 * Deliberately partial. It handles the text-based PDFs people actually paste
 * into a positioning tool (exported landing pages, whitepapers, Notion/Google
 * Docs exports) and refuses to pretend it handled image-only scans.
 *
 * This is ~120 lines instead of a 20MB dependency, and its failure mode is
 * loud: "no text layer".
 */
export function extractPdf(buf: Buffer): ExtractResult {
  const raw = buf.toString('latin1');
  const degraded: string[] = [];
  const pageCount = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length || undefined;

  // Collect every stream, inflate the ones that look compressed.
  const chunks: Buffer[] = [];
  const streamRe = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  let decoded = 0;
  while ((m = streamRe.exec(raw)) !== null) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) break;
    const slice = buf.subarray(start, end);
    try {
      const out = inflateSync(slice);
      chunks.push(out);
      decoded += 1;
    } catch {
      // Uncompressed streams are rare but legal. Keep them raw.
      if (/BT[\s\S]{0,200}Tj|TJ/.test(slice.toString('latin1'))) chunks.push(slice);
    }
  }

  const textParts: string[] = [];
  for (const c of chunks) {
    const s = c.toString('latin1');
    textParts.push(...pdfTextOperators(s));
  }

  const text = normalisePdfText(textParts.join(' '));
  if (countWords(text) < 12) {
    degraded.push(
      'PDF has no usable text layer (likely a scan or image export). No OCR is bundled: run it through a local OCR tool such as Tesseract and pass the output, or paste the text. We will not invent content from an unreadable file.',
    );
  }
  if (pageCount && decoded === 0) degraded.push('no decodable content streams were found');

  return {
    text,
    format: 'pdf',
    degraded,
    meta: { pages: pageCount, wordCount: countWords(text), decodedBinary: true },
  };
}

/** Extracts the string arguments of Tj / TJ / ' / " text operators. */
function pdfTextOperators(stream: string): string[] {
  const out: string[] = [];
  // (literal string) forms
  const litRe = /\((?:\\.|[^\\()])*\)/g;
  // Array form: [(A) -20 (B)] TJ
  const arrayRe = /\[((?:[^\][]|\\.)*)\]\s*TJ/g;
  let am: RegExpExecArray | null;
  while ((am = arrayRe.exec(stream)) !== null) {
    const inner = am[1];
    let lm: RegExpExecArray | null;
    const litInner = /\((?:\\.|[^\\()])*\)/g;
    const parts: string[] = [];
    while ((lm = litInner.exec(inner)) !== null) parts.push(unescapePdf(lm[0].slice(1, -1)));
    if (parts.length) out.push(parts.join(''));
  }
  // Fallback single-string form, only where a text operator follows.
  const singleRe = /\((?:\\.|[^\\()])*\)\s*(?:Tj|'|")/g;
  let sm: RegExpExecArray | null;
  while ((sm = singleRe.exec(stream)) !== null) {
    const lit = sm[0].match(litRe)?.[0];
    if (lit) out.push(unescapePdf(lit.slice(1, -1)));
  }
  return out;
}

function unescapePdf(s: string): string {
  return s
    .replace(/\\([nrtbf()\\])/g, (_x, c: string) =>
      ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' })[c] ?? c,
    )
    .replace(/\\([0-7]{1,3})/g, (_x, o: string) => String.fromCharCode(parseInt(o, 8)));
}

function normalisePdfText(s: string): string {
  return s
    .replace(/\u0000/g, '')
    .replace(/([a-z])([A-Z])/g, (match, a: string, b: string) => `${a} ${b}`)
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?])/g, '$1')
    .trim();
}

/** DOCX: a zip whose word/document.xml holds the text. */
export function extractDocx(buf: Buffer): ExtractResult {
  const xml = readZipEntry(buf, 'word/document.xml');
  if (!xml) {
    return {
      text: '',
      format: 'docx',
      degraded: ['word/document.xml not found in the .docx container; file may be corrupt or password-protected'],
      meta: { wordCount: 0, decodedBinary: true },
    };
  }
  const text = xml
    .replace(/<w:p[ >]/g, '\n<w:p ')
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return {
    text,
    format: 'docx',
    degraded: text ? [] : ['document.xml contained no text runs'],
    meta: { wordCount: countWords(text), decodedBinary: true },
  };
}

/**
 * Minimal ZIP reader: central directory → local header → inflate.
 * Enough for .docx, which is the only zip format we support locally.
 */
function readZipEntry(buf: Buffer, wanted: string): string | null {
  const EOCD = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return null;
  const entries = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  let p = cdOffset;
  for (let i = 0; i < entries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    if (name === wanted) {
      const lh = localOffset;
      if (buf.readUInt32LE(lh) !== 0x04034b50) return null;
      const lNameLen = buf.readUInt16LE(lh + 26);
      const lExtraLen = buf.readUInt16LE(lh + 28);
      const dataStart = lh + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return data.toString('utf8');
      try {
        return inflateSync(data).toString('utf8');
      } catch {
        return null;
      }
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}
