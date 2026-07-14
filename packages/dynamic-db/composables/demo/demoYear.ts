export const DEMO_YEAR_KEY = 'demo-year-filter'
export const DEMO_YEAR_EVENT = 'demo-year-change'
export const ALL_YEARS = 'ALL'

export function getDemoYear(): string {
  if (!import.meta.client) return ALL_YEARS
  return localStorage.getItem(DEMO_YEAR_KEY) || ALL_YEARS
}

export function setDemoYear(year: string) {
  localStorage.setItem(DEMO_YEAR_KEY, year)
  window.dispatchEvent(new CustomEvent(DEMO_YEAR_EVENT, { detail: { year } }))
}

/** Reactive year for filter consumers: seed from localStorage, track window events. */
export function useDemoYear() {
  const year = ref<string>(getDemoYear())
  const handler = (e: Event) => {
    year.value = (e as CustomEvent<{ year: string }>).detail.year
  }
  onMounted(() => window.addEventListener(DEMO_YEAR_EVENT, handler))
  onUnmounted(() => window.removeEventListener(DEMO_YEAR_EVENT, handler))
  return year
}

/** True when an ISO date (YYYY-MM-DD) falls in the selected year (ALL = always true). */
export function inDemoYear(isoDate: string | undefined | null, year: string): boolean {
  return year === ALL_YEARS || (isoDate || '').startsWith(year)
}
