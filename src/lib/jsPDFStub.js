export class jsPDF {
  constructor() {
    this.lines = [];
  }

  setFont() {}

  setFontSize() {}

  setTextColor() {}

  addPage() {
    this.lines.push('\f');
  }

  text(content) {
    if (Array.isArray(content)) {
      this.lines.push(...content);
    } else {
      this.lines.push(String(content));
    }
  }

  splitTextToSize(text, maxWidth) {
    if (!text) return [''];
    const words = String(text).split(/\s+/);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      if ((current + ' ' + word).trim().length > maxWidth) {
        if (current) {
          lines.push(current.trim());
        }
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    });

    if (current) {
      lines.push(current.trim());
    }

    return lines.length ? lines : [''];
  }

  save(filename) {
    const blob = new Blob([this.lines.join('\n')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'document.pdf';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
