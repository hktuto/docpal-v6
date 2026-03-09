<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { StatusMap, ScanTableColumns } from '#imports'
const { filter } = useScanClient()

const emit = defineEmits(['search'])
const filterUpdate = computed({
  get() {
    return [filter.value.updatedAtStart, filter.value.updatedAtEnd]
  },
  set(val: [string, string]) {
    if (!val) {
      filter.value.updatedAtStart = ''
      filter.value.updatedAtEnd = ''
      return
    }
    if (val[0] && val[1]) {
      filter.value.updatedAtStart = val[0] + 'Z'
      filter.value.updatedAtEnd = val[1] + 'Z'
      // TODO , change end time t0 23:59:59 to include the whole day
      return
    }
    filter.value.updatedAtStart = ''
    filter.value.updatedAtEnd = ''
  }
})
const filterCreate = computed({
  get() {
    return [filter.value.createdAtStart, filter.value.createdAtEnd]
  },
  set(val: [string, string]) {
    if (!val) {
      filter.value.createdAtStart = ''
      filter.value.createdAtEnd = ''
      return
    }
    if (val[0] && val[1]) {
      filter.value.createdAtStart = val[0] + 'Z'
      filter.value.createdAtEnd = val[1] + 'Z'
      // TODO , change end time t0 23:59:59 to include the whole day
      return
    }
    filter.value.createdAtStart = ''
    filter.value.createdAtEnd = ''
  }
})

const shortcuts = [
  {
    text: 'Last week',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: 'Last month',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: 'Last 3 months',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

const search = useDebounceFn(() => {
  emit('search', filter)
}, 500)

watchThrottled(filter, search, { throttle: 300 })
</script>

<template>
  <div class="fitlerRow">
    <!-- /status-count -->
    <ElInput v-model="filter.filter" placeholder="Search..." clearable />
    <ElSelect v-model="filter.status" placeholder="Status" multiple clearable>
      <ElOption v-for="(status, key) in StatusMap" :key="key" :label="key" :value="key" />
    </ElSelect>
    <el-date-picker
      v-show="false"
      ref="createDatepicker"
      v-model="filterCreate"
      type="daterange"
      unlink-panels
      value-format="YYYY-MM-DDTHH:mm:ss"
      range-separator="~"
      start-placeholder="Create"
      end-placeholder="End date"
      :shortcuts="shortcuts"
    />
    <el-date-picker
      v-show="false"
      ref="updateDatepicker"
      v-model="filterUpdate"
      type="daterange"
      unlink-panels
      value-format="YYYY-MM-DDTHH:mm:ss"
      range-separator="~"
      start-placeholder="Update date"
      end-placeholder="End date"
      :shortcuts="shortcuts"
    />
    <div class="sortContainer">
      <ElDropdown>
        <span class="el-dropdown-link">
          {{ filter.orderBy }}
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem v-for="col in ScanTableColumns" :key="col.field" @click="filter.orderBy = col.field">
              <span :class="{ orderBySelected: filter.orderBy === col.field }">{{ col.title }}</span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <Icon :name="filter.isDesc ? 'mdi:sort-descending' : 'mdi:sort-ascending'" class="sortIcon" @click="filter.isDesc = !filter.isDesc" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sortContainer,
.el-dropdown-link {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
}
.fitlerRow {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-s);
}
.orderBySelected,
.sortIcon {
  color: var(--app-primary-color);
}
</style>
