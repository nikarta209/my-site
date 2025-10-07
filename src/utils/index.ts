export function createPageUrl(pageName: string) {
    if (!pageName) {
        return '/';
    }

    const [rawPath, queryString] = pageName.split('?');
    const trimmedPath = rawPath.trim();
    const sanitizedPath = trimmedPath.replace(/ /g, '-');

    const normalizedPath = sanitizedPath.startsWith('/')
        ? sanitizedPath
        : `/${sanitizedPath}`;

    return queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
}
