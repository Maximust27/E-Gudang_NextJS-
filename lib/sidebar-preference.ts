// Shared by the server layout and the client sidebar provider.
export const SIDEBAR_COOKIE_NAME = "sidebar_state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function parseSidebarPreference(value: string | undefined) {
  return value !== "false"
}
