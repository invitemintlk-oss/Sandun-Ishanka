/** Single source of truth for the couple's names (used by the admin link generator). */
export const WEDDING = {
  groomName: 'Sandun',
  brideName: 'Ishanka',
} as const;

export type PrefixKey = 'mr' | 'mrs' | 'miss' | 'mrmrs' | 'family' | 'dear';

export const PREFIXES: { key: PrefixKey; label: string }[] = [
  { key: 'mr', label: 'Mr.' },
  { key: 'mrs', label: 'Mrs.' },
  { key: 'miss', label: 'Miss' },
  { key: 'mrmrs', label: 'Mr. & Mrs.' },
  { key: 'family', label: 'Family' },
  { key: 'dear', label: 'Dear' },
];

const isPrefixKey = (v: string | null): v is PrefixKey => PREFIXES.some((p) => p.key === v);

/** Collapses whitespace and trims a typed guest name. */
export const normalizeName = (name: string) => name.replace(/\s+/g, ' ').trim();

/**
 * Combines prefix + name into the display name.
 * "Dear" is a greeting style, not a title, so it returns the plain name
 * (the greeting "Dear …" is added separately in buildGreeting).
 */
export function buildDisplayName(prefix: PrefixKey, rawName: string): string {
  const name = normalizeName(rawName);
  if (!name) return '';
  switch (prefix) {
    case 'mr':
      return `Mr. ${name}`;
    case 'mrs':
      return `Mrs. ${name}`;
    case 'miss':
      return `Miss ${name}`;
    case 'mrmrs':
      return `Mr. & Mrs. ${name}`;
    case 'family':
      return `${name} and Family`;
    case 'dear':
    default:
      return name;
  }
}

/** "Dear {displayName} ❤️" – never produces "Dear Dear …". */
export const buildGreeting = (displayName: string) => `Dear ${displayName} ❤️`;

/**
 * Personalized link: {baseURL}/{guestName}
 * The prefix travels as a short ?p= key so the website can show the full display name
 * (omitted for "Dear", which shows the plain name).
 */
export function buildInviteLink(baseUrl: string, prefix: PrefixKey, rawName: string): string {
  const name = normalizeName(rawName);
  const base = baseUrl.replace(/\/+$/, '');
  const link = `${base}/${encodeURIComponent(name)}`;
  return prefix === 'dear' ? link : `${link}?p=${prefix}`;
}

export function buildInviteMessage(displayName: string, link: string): string {
  return `${buildGreeting(displayName)}

With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our journey together.

Please view our wedding invitation and all the event details through the link below 🌐:

${link}

Your presence would truly mean the world to us, and we would be honored to celebrate this beautiful moment together.

With love,
❤️ ${WEDDING.groomName} & ${WEDDING.brideName}`;
}

/** Reads the guest from the current URL (/{guestName}?p=prefix). Returns '' when none. */
export function getGuestDisplayNameFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const segment = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
  if (!segment || segment.toLowerCase() === 'admin' || segment.includes('.')) return '';

  let name = '';
  try {
    name = normalizeName(decodeURIComponent(segment));
  } catch {
    return '';
  }
  if (!name || name.length > 80) return '';

  const p = new URLSearchParams(window.location.search).get('p');
  return buildDisplayName(isPrefixKey(p) ? p : 'dear', name);
}
