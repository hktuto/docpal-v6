export const DEMO_BRAND_KEY = 'demo-brand-filter'
export const DEMO_BRAND_EVENT = 'demo-brand-change'
export const ALL_BRANDS = 'ALL'

export function getDemoBrands(): string[] {
  if (!import.meta.client) return [ALL_BRANDS]
  const raw = localStorage.getItem(DEMO_BRAND_KEY)
  if (!raw) return [ALL_BRANDS]
  if (!raw.startsWith('[')) return [raw] // migrate legacy single-string value
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) && arr.length ? arr : [ALL_BRANDS]
  } catch {
    return [ALL_BRANDS]
  }
}

export function setDemoBrands(brands: string[]) {
  const value = brands.length ? brands : [ALL_BRANDS]
  localStorage.setItem(DEMO_BRAND_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(DEMO_BRAND_EVENT, { detail: { brands: value } }))
}

/** Reactive brand selection for filter consumers: seed from localStorage, track window events. */
export function useDemoBrands() {
  const brands = ref<string[]>(getDemoBrands())
  const handler = (e: Event) => {
    brands.value = (e as CustomEvent<{ brands: string[] }>).detail.brands
  }
  onMounted(() => window.addEventListener(DEMO_BRAND_EVENT, handler))
  onUnmounted(() => window.removeEventListener(DEMO_BRAND_EVENT, handler))
  return brands
}
