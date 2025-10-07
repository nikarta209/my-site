export function createPageUrl(pageName: string) {
    if (!pageName) {
        return '/';
    }

    const match = pageName.match(/^[^?#]*/);
    const rawPath = match ? match[0] : pageName;
    const suffix = pageName.slice(rawPath.length);

    const normalizedPath = rawPath
        .trim()
        .replace(/^\/+/, '')
        .toLowerCase()
        .replace(/ /g, '-');

    return `/${normalizedPath}${suffix}`;
}
