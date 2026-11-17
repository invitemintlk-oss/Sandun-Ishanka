/**
 * Google Sheets connection (via Google Apps Script Web App).
 *
 * Paste your Web App URL (ends with /exec) below, OR set
 * VITE_GOOGLE_APPS_SCRIPT_URL in a .env file / your hosting env vars.
 */
const PASTE_WEB_APP_URL_HERE =
  'https://script.google.com/macros/s/AKfycbzpMsFKAXd1U7-ZEJq8Gai4tCaizRa_ao55N0qBC0pAfUJHO9xqBENDB4dXXmFvA8rnGQ/exec';

export const SCRIPT_URL: string =
  (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined)?.trim() || PASTE_WEB_APP_URL_HERE;

export interface SheetWish {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

/**
 * Sends data to the sheet. Uses no-cors (Apps Script doesn't return CORS headers on POST),
 * so the response can't be read – a resolved promise means the request was delivered.
 */
export async function submitToSheet(sheet: 'RSVP' | 'WISH', data: Record<string, string>): Promise<void> {
  if (!SCRIPT_URL) throw new Error('Google Apps Script URL is not configured (see src/lib/sheets.ts).');

  const body = new URLSearchParams({ sheet, ...data });
  await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });
}

/** Loads approved wishes from the WISH tab, newest first. */
export async function fetchWishes(): Promise<SheetWish[]> {
  if (!SCRIPT_URL) return [];
  const res = await fetch(`${SCRIPT_URL}?action=wishes&t=${Date.now()}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to load wishes');
  return json.wishes as SheetWish[];
}
