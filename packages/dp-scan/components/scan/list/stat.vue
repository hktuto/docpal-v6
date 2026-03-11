<script lang="ts" setup>
import { clientApi } from 'api'
import { StatusMap } from '#imports'
const { projects } = useScanClient()
const stat = ref()
const loading = ref(true)
const getStats = async () => {
  loading.value = true
  try {
    const { data } = (await clientApi.api.postCaptureBatchStatusCount({
      projectId: projects.value.map((project) => project.id)
    })) as any
    stat.value = data
  } catch (err) {
    stat.value = undefined
  } finally {
    loading.value = false
  }
}
function foundStat(item: any) {
  const possibleKeys = item.key.split(',').map((key) => key.trim())
  const possibleStat = Object.keys(stat.value || {}).find((key) => possibleKeys.includes(key))
  const result = possibleStat ? stat.value[possibleStat] : 0
  return result
}
watch(
  projects,
  (projectList) => {
    if (projectList.length === 0) return
    getStats()
  },
  {
    immediate: true
  }
)
defineExpose({
  getStats
})
</script>

<template>
  <div v-loading="loading" class="StatusSection">
    <div class="sectionTitle">Batch Status</div>
    <div class="statusContainer">
      <div class="statItem" style="background-color: var(--app-info-color)">
        <div class="statKey">Total</div>
        <div class="statValue">{{ stat?.total || 0 }}</div>
      </div>
      <div v-for="(item, key) in StatusMap" :key="key" class="statItem" :style="{ backgroundColor: item.color }">
        <div class="statKey">{{ key }}</div>
        <div class="statValue">{{ foundStat(item) || 0 }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sectionTitle {
  font-size: var(--app-font-size-l);
  font-weight: bold;
  margin-bottom: var(--app-space-s);
}
.statusContainer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--app-space-s);
}
.statItem {
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  color: #fff;
}
.statKey {
  font-size: var(--app-font-size-s);
}
.statValue {
  font-size: var(--app-font-size-xxl);
  font-weight: bold;
}
</style>
