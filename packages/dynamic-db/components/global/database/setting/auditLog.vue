<script setup lang="ts">
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
import { computed, formatDate, groupAuditLogsByDate, ref, watch } from '#imports'

const props = defineProps<{
  masterTableId: string
}>()

const list = ref<any[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const hasMore = ref(true)
const expandedIds = ref<Set<string>>(new Set())
const pendingReset = ref(false)

const itemKeyMap = new WeakMap<object, string>()
let itemKeyCounter = 0

function ensureItemKey(item: any) {
  if (item.event_id) return item.event_id
  if (!itemKeyMap.has(item)) {
    itemKeyMap.set(item, `audit-log-${itemKeyCounter++}`)
  }
  return itemKeyMap.get(item)!
}

const keyedList = computed(() =>
  list.value.map((item) => ({
    ...item,
    _key: ensureItemKey(item),
  }))
)

const groupedList = computed(() => groupAuditLogsByDate(keyedList.value))

async function fetchAuditLogs(reset = false) {
  if (loading.value) {
    if (reset) pendingReset.value = true
    return
  }
  if (reset) {
    list.value = []
    pageNum.value = 1
    hasMore.value = true
    expandedIds.value = new Set()
    pendingReset.value = false
  }
  if (!hasMore.value) return
  loading.value = true
  try {
    const res: any = await clientApi.api.postAuditLogPage({
      page_size: pageSize.value,
      page_num: pageNum.value,
      ref_id: props.masterTableId,
    })
    const rows = res?.data?.entryList || []
    rows.forEach((row: any) => ensureItemKey(row))
    list.value.push(...rows)
    hasMore.value = res?.data?.isNextPageAvailable ?? false
    pageNum.value += 1
  } catch (e) {
    ElMessage.error($t('auditLog_loadError'))
  } finally {
    loading.value = false
    if (pendingReset.value) {
      pendingReset.value = false
      await fetchAuditLogs(true)
    }
  }
}

function handleLoadMore() {
  fetchAuditLogs(false)
}

function handleToggleExpand(eventId: string) {
  const next = new Set(expandedIds.value)
  if (next.has(eventId)) {
    next.delete(eventId)
  } else {
    next.add(eventId)
  }
  expandedIds.value = next
}

watch(
  () => props.masterTableId,
  () => fetchAuditLogs(true),
  { immediate: true }
)
</script>

<template>
  <div
    class="audit-log-root"
    v-infinite-scroll="handleLoadMore"
    :infinite-scroll-disabled="!hasMore || loading"
    :infinite-scroll-immediate="false"
    infinite-scroll-distance="3"
    v-loading="loading && list.length === 0"
  >
    <el-empty v-if="!loading && list.length === 0" :description="$t('auditLog_empty')" />
    <el-timeline v-else>
      <template v-for="group in groupedList" :key="group.date">
        <el-timeline-item class="date-header-item">
          <template #dot>
            <div class="date-dot" />
          </template>
          <div class="date-header">{{ formatDate(group.date) }}</div>
        </el-timeline-item>
        <el-timeline-item
          v-for="item in group.items"
          :key="item._key"
          :timestamp="formatDate(item.timestamp, 'HH:mm')"
        >
          <div
            class="timeline-summary"
            role="button"
            tabindex="0"
            :aria-expanded="expandedIds.has(item._key)"
            :aria-label="$t('auditLog_toggleDetails')"
            @click="handleToggleExpand(item._key)"
            @keydown.enter.space.prevent="handleToggleExpand(item._key)"
          >
            <span class="user">{{ item.user_id }}</span>
            <span class="action">{{ item.event_type }}</span>
          </div>
          <div
            v-if="expandedIds.has(item._key)"
            class="payload"
          >
            <pre>{{ JSON.stringify(item.details, null, 2) }}</pre>
          </div>
        </el-timeline-item>
      </template>
    </el-timeline>
  </div>
</template>

<style lang="scss" scoped>
.audit-log-root {
  height: 100%;
  overflow: auto;
}

.date-header-item {
  :deep(.el-timeline-item__content) {
    padding-top: 0;
  }
}

.date-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
}

.date-header {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.timeline-summary {
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  align-items: center;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  .user {
    font-weight: 600;
  }

  .action {
    color: var(--el-text-color-regular);
  }
}

.payload {
  margin-top: var(--app-space-xs);
  max-height: 200px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--app-space-xs);

  pre {
    margin: 0;
    font-size: var(--app-font-size-s);
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
