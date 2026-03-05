<script lang="ts" setup>
import { clientApi } from 'api'
import { StatusMap } from '../../../utils/scanHelper'
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

watch(
  projects,
  () => {
    getStats()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div v-loading="loading" class="StatusSection">
    <div class="sectionTitle">Batch Status</div>
    <div class="statusContainer">
      <div v-for="(item, key) in StatusMap" :key="key" class="statItem" :style="{ backgroundColor: item.color }">
        <div class="statKey">{{ key }}</div>
        <div class="statValue">{{ stat?.[key] || 0 }}</div>
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
