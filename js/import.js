// Load text from a .txt / .md or Word .docx file. Word headings become
// "# " / "## " lines so they are written as headings.
export async function importFile(file) {
  if (/\.docx$/i.test(file.name)) return readDocx(await file.arrayBuffer());
  return (await file.text()).replace(/\r\n?/g, '\n');
}

async function readDocx(buf) {
  const xml = await unzipEntry(new Uint8Array(buf), 'word/document.xml');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const lines = [];
  for (const p of doc.getElementsByTagNameNS(W, 'p')) {
    let text = '';
    for (const node of p.getElementsByTagNameNS(W, '*')) {
      if (node.localName === 't') text += node.textContent;
      else if (node.localName === 'tab') text += '\t';
      else if (node.localName === 'br') text += '\n';
    }
    const style = p.getElementsByTagNameNS(W, 'pStyle')[0]?.getAttributeNS(W, 'val') || '';
    if (text.trim() && /^(Title|Heading1)$/i.test(style)) text = '# ' + text.trim();
    else if (text.trim() && /^Heading\d$/i.test(style)) text = '## ' + text.trim();
    lines.push(text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Minimal ZIP reader: finds one entry through the central directory and
// inflates it with the browser's DecompressionStream.
async function unzipEntry(bytes, wanted) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a .docx file');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (name === wanted) {
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const data = bytes.subarray(start, start + size);
      if (method === 0) return dec.decode(data);
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(stream).text();
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('No document text found');
}
