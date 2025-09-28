/*
 * Minimal stub implementation of the jsPDF API used inside the reader sidebar.
 * It records drawing commands so the application code can run without the real
 * jspdf package (which is unavailable in the execution environment). The
 * exported class mirrors the subset of methods we rely on.
 */
export class jsPDF {
  constructor() {
    this.pages = [[]];
    this.currentPage = 0;
  }

  _ensurePage() {
    if (!this.pages[this.currentPage]) {
      this.pages[this.currentPage] = [];
    }
  }

  _record(command) {
    this._ensurePage();
    this.pages[this.currentPage].push(command);
    return this;
  }

  setFont() {
    return this._record({ type: 'setFont' });
  }

  setFontSize(size) {
    return this._record({ type: 'setFontSize', size });
  }

  setTextColor(r, g, b) {
    return this._record({ type: 'setTextColor', color: [r, g, b].filter((value) => value !== undefined) });
  }

  text(content, x, y) {
    return this._record({ type: 'text', content, x, y });
  }

  addPage() {
    this.currentPage += 1;
    this.pages[this.currentPage] = [];
    return this;
  }

  splitTextToSize(text, maxWidth) {
    if (Array.isArray(text)) {
      return text;
    }

    const words = String(text).split(/\s+/);
    const lines = [];
    let current = '';
    const limit = Math.max(1, Math.floor(Number(maxWidth) || 80));

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > limit && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });

    if (current) {
      lines.push(current);
    }

    return lines.length ? lines : [''];
  }

  save(filename) {
    // eslint-disable-next-line no-console
    console.info(`jsPDF stub save invoked: ${filename}`);
    return this._record({ type: 'save', filename });
  }
}

export default { jsPDF };
