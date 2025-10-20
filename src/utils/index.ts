export function createPageUrl(pageName: string) {
    if (!pageName) {
        return '/';
    }

    const trimmed = pageName.trim();
    if (!trimmed) {
        return '/';
    }

    const [rawPath, ...queryParts] = trimmed.split('?');
    const sanitizedPath = rawPath
        .replace(/\s+/g, '')
        .replace(/^\/+/, '');

    const normalizedPath = sanitizedPath.toLowerCase();

    if (normalizedPath === 'bookdetails') {
        if (queryParts.length > 0) {
            const query = queryParts.join('?');
            const params = new URLSearchParams(query);
            const id = params.get('id');

            if (id) {
                return `/books/${id}`;
            }
        }

        return '/books';
    }

    const basePath = sanitizedPath ? `/${sanitizedPath}` : '/';

    if (queryParts.length === 0) {
        return basePath;
    }

    const query = queryParts.join('?');
    return `${basePath}?${query}`;
}
