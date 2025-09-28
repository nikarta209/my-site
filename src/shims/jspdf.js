export class jsPDF {
  constructor() {
    this._lines = [];
  }

  setFont() {}

  setFontSize() {}

  setTextColor() {}

  text(content) {
    if (Array.isArray(content)) {
      this._lines.push(...content);
    } else if (typeof content === 'string') {
      this._lines.push(content);
    }
  }

  addPage() {}

  splitTextToSize(text) {
    if (Array.isArray(text)) {
      return text.map(String);
    }
    if (text == null) {
      return [];
    }
    const str = String(text);
    if (str.length === 0) {
      return [];
    }
    const words = str.split(/\s+/);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      if ((current + ' ' + word).trim().length > 90) {
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

    return lines.length > 0 ? lines : [str];
  }

  save() {}
}

export default jsPDF;
