<script setup lang="ts">
import MdCardWidget from './widget.vue'

interface Props {
  rows: any[]
  widgetStyle: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  rows: () => [],
  widgetStyle: () => ({})
})

const emit = defineEmits<{
  'open-record': [row: any]
}>()
const { columns, viewStyleConfig } = useMDCardInject()
const gridStyle = computed(() => {
  const columns = Math.max(1, Math.min(8, viewStyleConfig.value?.cardCount || 1))
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
  }
})

function handleOpenRecord(row: any) {
  emit('open-record', row)
}
</script>

<template>
  <div class="md-card-list">
    <div v-if="rows.length > 0" class="card-grid" :style="gridStyle">
      <MdCardWidget
        v-for="row in rows"
        :key="row.id"
        :row="row"
        :fields="columns"
        :style-config="widgetStyle"
        @open-record="handleOpenRecord"
      />
    </div>
    <el-empty v-else description="暂无记录" />
  </div>
</template>

<style scoped lang="scss">
.md-card-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--app-space-s);
}

.card-grid {
  display: grid;
  gap: 12px;
}
</style>
