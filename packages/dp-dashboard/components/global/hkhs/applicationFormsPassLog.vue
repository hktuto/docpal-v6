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
const tableComponent = ref([
  { label: '(1)Uploaded', value: 'uploaded' },
  { label: '(2)Failed to Process', value: 'failedToProcess' },
  { label: '(3)Processed', value: 'processed' },
  { label: '(4)Verified', value: 'verified' },
  { label: '(5)Failed to Export', value: 'failedToExport' },
  { label: '(6)Export-Ready', value: 'exportReady' },
  { label: '(7)Completed', value: 'completed' },
  { label: '(8)Cancelled', value: 'cancelled' }
])

const formData = ref({
  project: '',
  date: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
})
const name = ref('SCS-101 - Activity Log of Application Forms Processed')
const hkhsTableRef = ref()
const sortingField = ref('')
const orderBy = ref(true)
const projectList = ref([])
const sortingName = computed(() => {
  let find = tableComponent.value.find((item: any) => item.value === sortingField.value)
  return find ? find.title : tableComponent.value[0].label
})

onMounted(async () => {
  projectList.value = await newClientApi.postCaptureProjPage({}).then((r) => r.data)
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
    :show-delete-icon="showDeleteIcon"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="toolbar-wrap-1">
      <h4 class="title-suffix-name">{{ name }}</h4>
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
    </div>

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
              <el-dropdown-item v-for="(item, index) in tableComponent" :command="item.value">{{ item.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <Icon :name="orderBy ? 'mdi:sort-descending' : 'mdi:sort-ascending'" style="background-color: #1abc9c" @click="handleOrderBy" />
      </div>
    </div>

    <div class="table-list-scroll">
      <template v-for="(item, index) in tableComponent" :key="item.value">
        <div class="table-block">
          <HkhsTable
            ref="hkhsTableRef"
            :name="item.label"
            :stage="item.value"
            :startDate="formData.date[0]"
            :endDate="formData.date[1]"
            :sortingField="sortingField"
            :orderBy="orderBy"
          />
        </div>
      </template>
    </div>
  </DashboardCard>
</template>

<style scoped lang="scss">
.title-suffix-name {
  font-size: 35px;
  line-height: 35px;
}

.toolbar-wrap {
  margin-top: 30px;
  margin-block: 20px;
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
