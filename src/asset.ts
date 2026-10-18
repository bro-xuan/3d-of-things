/**
 * A file from public/ (models/…, posters/…), wherever the site is served: beside the page, or
 * under its mount when it's baked into another site (see vite.config.ts).
 */
export const asset = (file: string): string => `${import.meta.env.BASE_URL}${file}`;
