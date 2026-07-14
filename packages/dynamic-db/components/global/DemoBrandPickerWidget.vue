<template>
  <DashboardCard
    :title="title"
    :subtitle="setting.subtitle"
    :footer="setting.footer"
    :hide-setting="hideSetting"
    :bordered="false"
    :show-shadow="false"
    :show-fullscreen-icon="false"
    @delete="emit('delete')"
    @refresh="load"
  >
    <div class="demo-widget brand-row">
      <button
        v-for="b in options"
        :key="b.value"
        class="brand-pill"
        :class="{ active: isActive(b.value) }"
        @click="toggle(b.value)"
      >
        {{ b.label }}
      </button>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import { loadInventory, distinctValues } from '../../composables/demo/useDemoData'
import { useDemoBrands, setDemoBrands, ALL_BRANDS, DEMO_BRAND_EVENT } from '../../composables/demo/demoBrand'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || '品牌篩選')
const loading = ref(false)

const brands = useDemoBrands()
const brandList = ref<string[]>([])
const options = computed(() => [{ label: '全部', value: ALL_BRANDS }, ...brandList.value.map((b) => ({ label: b, value: b }))])

function isActive(value: string) {
  if (value === ALL_BRANDS) return brands.value.includes(ALL_BRANDS)
  return !brands.value.includes(ALL_BRANDS) && brands.value.includes(value)
}

function toggle(value: string) {
  if (value === ALL_BRANDS) {
    setDemoBrands([ALL_BRANDS])
    return
  }
  const next = brands.value.filter((b) => b !== ALL_BRANDS)
  const i = next.indexOf(value)
  if (i >= 0) next.splice(i, 1)
  else next.push(value)
  setDemoBrands(next.length ? next : [ALL_BRANDS])
}

async function load() {
  loading.value = true
  try {
    const inventory = await loadInventory()
    brandList.value = distinctValues(inventory, 'brand')
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
  // Sync already-rendered widgets with the persisted brands (no ALL-then-filter flicker on reload).
  window.dispatchEvent(new CustomEvent(DEMO_BRAND_EVENT, { detail: { brands: brands.value } }))
})
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  white-space: nowrap;
}
.brand-pill {
  flex: none;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 1rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background: transparent;
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
}
.brand-pill.active {
  background: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary, #409eff);
  color: #fff;
}
</style>
