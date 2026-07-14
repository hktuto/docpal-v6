<template>
  <DashboardCard
    :title="title"
    :subtitle="setting.subtitle"
    :footer="setting.footer"
    :hide-setting="hideSetting"
    @delete="emit('delete')"
    @refresh="load"
  >
    <div class="demo-widget">
      <div ref="chartContainer" class="chart-container" />
    </div>
    <DemoInventoryDrillDialog v-model="drillVisible" :rows="drillRows" :title="drillTitle" />
  </DashboardCard>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import DemoInventoryDrillDialog from '../dashboard/demo/DemoInventoryDrillDialog.vue'
import { loadInventory, loadPartCosts, formatCompactCurrency } from '../../composables/demo/useDemoData'
import { useDemoChart } from '../../composables/demo/useDemoChart'
import { useDemoBrands, ALL_BRANDS } from '../../composables/demo/demoBrand'

echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

const BUCKETS = [
  { name: '0–60天', min: 0, max: 60 },
  { name: '61–180天', min: 61, max: 180 },
  { name: '181–360天', min: 181, max: 360 },
  { name: '361–720天', min: 361, max: 720 },
  { name: '720天以上', min: 721, max: Infinity }
]

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => '库存价值（按库龄）')
const loading = ref(false)

const brands = useDemoBrands()

const chartContainer = ref<HTMLElement>()
const { render } = useDemoChart(chartContainer)

const brandFilteredInventory = ref<any[]>([])
const drillVisible = ref(false)
const drillRows = ref<any[] | null>(null)
const drillTitle = ref('')

function onSliceClick(p: any) {
  const bucket = BUCKETS[p.dataIndex]
  if (!bucket) return
  drillRows.value = brandFilteredInventory.value.filter((r) => r.ageDays >= bucket.min && r.ageDays <= bucket.max)
  drillTitle.value = `${bucket.name} — 库存明细`
  drillVisible.value = true
}

async function load() {
  loading.value = true
  try {
    const [allInventory, partCosts] = await Promise.all([loadInventory(), loadPartCosts()])
    const inventory = allInventory.filter((r) => brands.value.includes(ALL_BRANDS) || brands.value.includes(r.brand))
    brandFilteredInventory.value = inventory
    const values = BUCKETS.map(() => 0)
    let total = 0
    for (const r of inventory) {
      const v = r.onHand * (partCosts[r.parts] || 0)
      total += v
      const i = BUCKETS.findIndex((b) => r.ageDays >= b.min && r.ageDays <= b.max)
      if (i >= 0) values[i] += v
    }
    render(
      {
        tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}：${formatCompactCurrency(p.value)}（${p.percent}%）` },
        legend: { orient: 'vertical', right: 10, top: 'center' },
        title: {
          text: formatCompactCurrency(total),
          subtext: '总计',
          left: '43%',
          top: '42%',
          textAlign: 'center',
          textStyle: { fontSize: 24, fontWeight: 'bold' },
          subtextStyle: { fontSize: 12 }
        },
        series: [
          {
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['45%', '50%'],
            avoidLabelOverlap: true,
            label: { formatter: '{b}（{d}%）' },
            data: BUCKETS.map((b, i) => ({ name: b.name, value: Math.round(values[i]) }))
          }
        ]
      },
      onSliceClick
    )
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

watch(brands, () => load())

onMounted(load)
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
}
.chart-container {
  height: 100%;
  width: 100%;
  cursor: pointer;
}
</style>
