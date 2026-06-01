const escapeSvgText = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const namedImageDataUri = (
  title: string,
  subtitle = "",
  palette: [string, string, string] = ["#344E41", "#588157", "#E9EDC9"]
) => {
  const safeTitle = escapeSvgText(title);
  const safeSubtitle = escapeSvgText(subtitle);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.58" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#bg)"/>
      <circle cx="104" cy="88" r="58" fill="#ffffff" opacity="0.14"/>
      <circle cx="548" cy="342" r="92" fill="#ffffff" opacity="0.16"/>
      <path d="M92 300 C168 220 230 360 312 278 S468 204 548 284" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.28"/>
      <text x="48" y="224" fill="#fff" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="42" font-weight="800">${safeTitle}</text>
      <text x="50" y="268" fill="#fff" opacity="0.86" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="20" font-weight="700">${safeSubtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
