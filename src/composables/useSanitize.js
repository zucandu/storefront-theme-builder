import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS when using v-html.
 * Allows safe HTML tags (formatting, links, images, tables, iframes for YouTube/Vimeo).
 */
export function sanitizeHtml(html) {
    if (!html) return html;
    return DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder'],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
}
