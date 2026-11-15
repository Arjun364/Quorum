/** Content of one email; never put minutes text in it. */
export interface EmailContent {
  heading: string;
  body: string;
  /** Optional link into the app; emails never carry decisions or action tokens. */
  link?: { url: string; label: string };
}

/** Escapes text for safe inclusion in HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Renders the single minimal email layout as plain text and HTML. */
export function renderEmail(content: EmailContent): { text: string; html: string } {
  const text = [content.heading, '', content.body, content.link ? `\n${content.link.label}: ${content.link.url}` : '']
    .join('\n')
    .trim();
  const button = content.link
    ? `<p><a href="${escapeHtml(content.link.url)}" style="display:inline-block;padding:10px 18px;background:#1f3a34;color:#fff;border-radius:6px;text-decoration:none">${escapeHtml(content.link.label)}</a></p>`
    : '';
  const html = `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:520px;margin:auto;color:#1c1c1a"><h2 style="margin:0 0 12px">${escapeHtml(content.heading)}</h2><p style="line-height:1.5">${escapeHtml(content.body)}</p>${button}</div>`;
  return { text, html };
}
