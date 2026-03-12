<script setup lang="ts">
import { ArrowDownBold } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { newClientApi } from 'api'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: {},
    hideSetting: true
  }
)

const emits = defineEmits(['delete', 'refreshSetting'])
const { cardRef, settingRef, refresh, loading } = useDashboardCard({
  props
})
function handleDelete() {
  emits('delete')
}

function handleRefresh() {
  refresh()
}

const tableComponent = ref([
  { field: 'uploaded', title: '(1)Uploaded' },
  { field: 'failedToProcess', title: '(2)Failed to Process' },
  { field: 'processed', title: '(3)Processed' },
  { field: 'verified', title: '(4)Verified' },
  { field: 'failedToExport', title: '(5)Failed to Export' },
  { field: 'exportReady', title: '(6)Export-Ready' },
  { field: 'completed', title: '(7)Completed' },
  { field: 'cancelled', title: '(8)Cancelled' }
])

const formData = ref({
  project: '',
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
})
const name = ref('SCS-101 - Activity Log of Application Forms Processed')
const hkhsTableRef = ref()
const columnsRef = ref([
  { field: 'datetime', title: 'Date Time', fixed: 'left' },
  { field: 'batch_no', title: 'Batch No.' },
  { field: 'from_application_number', title: 'Form' },
  { field: 'to_application_number', title: 'To' },
  { field: 'no_of_application', title: 'No of Applications' },
  { field: 'form_type', title: 'Form Type' },
  { field: 'user_id', title: 'User ID' },
  { field: 'is_overwrite', title: 'Insert/Replace' },
  { field: 'remark', title: 'Remark' }
])
const sortingField = ref(columnsRef.value[0].field)
const orderBy = ref(true)
const projectList = ref<any[]>([])
const sortingName = computed(() => {
  let find = columnsRef.value.find((item: any) => item.field === sortingField.value)
  return find ? find.title : columnsRef.value[0].title
})

function handleDownloadCommand(command: string) {
  if (command === 'excel') {
    console.log('excel')
  } else if (command === 'pdf') {
    console.log('pdf')
  }
}

function query(){
  const refs = hkhsTableRef.value
  if (Array.isArray(refs)) {
    refs.forEach((inst: any) => inst?.query?.())
  } else if (refs?.query) {
    refs.query()
  }
}

function HandleSorting(command: string) {
  sortingField.value = command
  const refs = hkhsTableRef.value
  if (Array.isArray(refs)) {
    refs.forEach((inst: any) => inst?.HandleSorting?.())
  } else if (refs?.HandleSorting) {
    refs.HandleSorting()
  }
}

function handleOrderBy() {
  orderBy.value = !orderBy.value
  HandleSorting(sortingField.value)
}

onMounted(async () => {
  projectList.value = (await newClientApi.postCaptureProjPage({}).then((r) => r.data)) as any[]
})
</script>

<template>
  <DashboardCard
    ref="cardRef"
    v-loading="loading"
    class="dp-dashboard--card__padding"
    :settingRef="settingRef"
    :hideSetting="hideSetting"
    :setting="setting"
    :show-refresh-icon="false"
    :show-fullscreen-icon="false"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <template #title_suffix>
      <span class="title-suffix-name">{{ name }}</span>
    </template>
    <template #action_prefix>
      <el-dropdown trigger="click" @command="handleDownloadCommand">
        <el-button type="primary">
          Download &nbsp;<el-icon><ArrowDownBold /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="excel">Download Excel</el-dropdown-item>
            <el-dropdown-item command="pdf">Download PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
    <div class="toolbar-wrap">
      <div class="toolbar-form-row">
        <el-select class="toolbar-select toolbar-select--type" v-model="formData.project" @change="query">
          <el-option v-for="(item, index) in projectList" :label="item.name" :value="item.id" />
        </el-select>
        <el-date-picker
          class="toolbar-date"
          v-model="formData.date"
          type="daterange"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          range-separator="~"
          start-placeholder="Start month"
          end-placeholder="End month"
          unlink-panels
          :clearable="false"
          @change="query"
        />
      </div>

      <div class="toolbar-sorting-wrap">
        <el-dropdown trigger="click" @command="HandleSorting">
          <el-button text>
            {{ sortingName }} &nbsp;
            <el-icon><ArrowDownBold /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="(item, index) in columnsRef" :command="item.field">
                {{ item.title }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <Icon :name="orderBy ? 'mdi:sort-descending' : 'mdi:sort-ascending'" style="background-color: #1abc9c" @click="handleOrderBy" />
      </div>
    </div>

    <div class="table-list-scroll">
      <template v-for="(item, index) in tableComponent" :key="item.field">
        <div class="table-block">
          <HkhsTable
            ref="hkhsTableRef"
            :name="item.title"
            :stage="item.field"
            :startDate="formData.date[0]"
            :endDate="formData.date[1]"
            :sortingField="sortingField"
            :orderBy="orderBy"
          />
        </div>
      </template>
    </div>
    <HkhsSetting ref="settingRef" :setting="setting" @submit="(setting) => $emit('refreshSetting', setting)"/>
  </DashboardCard>
</template>

<style scoped lang="scss">
.title-suffix-name {
  font-size: 35px;
  line-height: 35px;
}

.toolbar-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toolbar-wrap-1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.toolbar-form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.toolbar-sorting-wrap {
  display: flex;
  align-items: center;
}

.toolbar-select {
  width: 180px;
}

.table-list-scroll {
  overflow-y: auto;
  height: calc(100% - 100px);
  max-height: 80vh;
}

.table-block {
  height: 600px;
}
</style>
