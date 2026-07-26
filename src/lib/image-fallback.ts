// Elegant luxury SVG placeholder rendered when a remote product image fails
// to load. Kept inline (data URL) so it never triggers another network
// request — and mirrors the OMORA matte-black + gold palette.
export const LUXURY_IMAGE_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>
    <defs>
      <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#0B0B0B'/>
        <stop offset='100%' stop-color='#1a1410'/>
      </linearGradient>
      <linearGradient id='gold' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#C8A24A'/>
        <stop offset='100%' stop-color='#E8CC7A'/>
      </linearGradient>
    </defs>
    <rect width='800' height='1000' fill='url(%23bg)'/>
    <g transform='translate(400 470)' fill='none' stroke='url(%23gold)' stroke-width='2'>
      <circle r='110' opacity='0.85'/>
      <circle r='78' opacity='0.55'/>
      <circle r='46' opacity='0.35'/>
      <path d='M0 -46 C 26 -46 46 -26 46 0 C 46 26 26 46 0 46 C -26 46 -46 26 -46 0 C -46 -26 -26 -46 0 -46 Z' opacity='0.9'/>
      <path d='M0 -78 L 0 78 M -78 0 L 78 0' opacity='0.4'/>
    </g>
    <text x='400' y='700' text-anchor='middle' font-family='Georgia, serif' font-size='34' fill='url(%23gold)' letter-spacing='6'>OMORA BLOOMS</text>
    <text x='400' y='740' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='14' fill='%23C8A24A' opacity='0.7' letter-spacing='4'>HANDMADE · LUXURY</text>
  </svg>`
)}`;

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.fallbackApplied === "1") return;
  el.dataset.fallbackApplied = "1";
  el.src = LUXURY_IMAGE_FALLBACK;
  el.style.objectFit = "cover";
}
