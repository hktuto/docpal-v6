<script lang="ts" setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { StatusMap, ScanTableColumns } from '#imports'
const { filter, projects, isCreator,isVerifier,isExporter,isAdmin  } = useScanClient()

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
const filterType = ref<"keyword" | 'Application'>()

const filtetKeyword = computed({
  get(){
    return filterType.value === 'keyword' ? filter.value.filter : filter.value.applicantNum
  },
  set(val){
    if (filterType.value === 'keyword') {
      filter.value.filter = val
      filter.value.applicantNum = ''
    } else {
      filter.value.applicantNum = val
      filter.value.filter = ''
    }
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

const filterableColumn = computed(() => {
  return ScanTableColumns.filter(col => col.filterable)
})

const search = useDebounceFn(() => {
  emit('search', filter)
}, 500)

function projectChange(newVal){
  console.log("Project changed:", newVal)
  if(!newVal) return
  if(isAdmin(newVal)){
    filter.value.status = []
  }else{
    let result = new Set()
    if(isExporter(newVal)) {
      result.add('exportReady')
    }
    if (isVerifier(newVal)) {
      result.add('failed')
      result.add('verification')
    }
    if (isCreator(newVal)) {
      result.add('processing')
      result.add('failed')
      result.add('verification')
    }
    filter.value.status = Array.from(result)
  }
}

watchThrottled(filter, search, { throttle: 300 })

</script>

<template>
  <div class="fitlerRow">
    <!-- /status-count -->
    <ElInput class="keywords" v-model="filtetKeyword" placeholder="Search..." clearable >
        <template #prefix>
          <Icon v-tooltip="filterType === 'keyword' ? 'Search by keyword' : 'Search by application'"
          :name="filterType === 'keyword' ? 'mdi:magnify' : 'mdi:application'" @click="filterType = filterType === 'keyword' ? 'Application' : 'keyword'"/>
        </template>
    </ElInput>
    <ElSelect class="project" v-model="filter.projectId"  placeholder="Projects" @change="projectChange">
      <ElOption v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
    </ElSelect>
    <ElSelect class="status" v-model="filter.status" collapse-tags placeholder="Status" multiple clearable>
      <ElOption v-for="(status, key) in StatusMap" :key="key" :label="status.label" :value="key" />
    </ElSelect>
    <el-date-picker
      v-show="false"
      class="datePicker"
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
      class="datePicker"
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
          {{filterableColumn.find(col => col.field === filter.orderBy)?.title}}
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem v-for="col in filterableColumn" :key="col.field" @click="filter.orderBy = col.field">
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
  :deep(.el-range-editor.el-input__wrapper){
      width: 200px;
  }
}
.keywords{
    width: 200px;
}
.project {
  width: 200px;
}
.status {
  width: 200px;
}
.datePicker{
    width: 200px;
}
.orderBySelected,
.sortIcon {
  color: var(--app-primary-color);
}
</style>
