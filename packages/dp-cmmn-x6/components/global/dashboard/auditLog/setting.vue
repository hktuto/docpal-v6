<script setup lang="ts">
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { newAdminApi } from 'api'

const { t } = useI18n()
const emits = defineEmits(['refresh'])

const showDialog = ref(false)
const loading = ref(false)

const setting = ref({
  uniqueIdentifier: '',
  category: 'case',
  columns: [
    { id: 'date', label: 'Date', width: 200 },
    { id: 'activities', label: 'Activities', width: 300 },
    { id: 'status', label: 'Status', width: 200 },
    { id: 'user', label: 'User', width: 150 }
  ]
})

const categoryFields = ref([
  { id: 'case', name: 'Case' },
  { id: 'masterTable', name: 'Master Table' }
])

function handleCategoryChange() {
  setting.value.uniqueIdentifier = ''
}

const newColumnName = ref('')

function handleAddColumns() {
  if (!newColumnName.value || '' == newColumnName.value) {
    return
  }

  const index = setting.value.columns.findIndex((item: any) => item.id === newColumnName.value)
  if (index !== -1) {
    ElMessage.error('Column name already exists')
    return
  }

  setting.value.columns.push({
    id: 'activities',
    number: 0,
    width: 300
  })

  newColumnName.value = ''
}

function handleDeleteColumn(index: number) {
  setting.value.columns.splice(index, 1)
}

function handleSubmit() {
  if (setting.value.category === 'masterTable' && '' == setting.value.uniqueIdentifier) {
    ElMessage.error('Please select Master Table.')
    return
  }

  showDialog.value = false
  emits('refresh', setting.value)
}

async function handleOpen(setting: any) {
  showDialog.value = true
  setting.value = deepCopy(setting)

  await getMasterTableList()
}

const masterTableList = ref([])

async function getMasterTableList() {
  const { data } = await newAdminApi.postDmsMasterTablePage({ pageSize: 100 })
  masterTableList.value = data.entryList.map((item) => ({
    id: item.id,
    name: item.name
  }))
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="showDialog" :title="$t('dashboard.setting')" class="scroll-dialog processSetting-dialog big"
             append-to-body :close-on-click-modal="false">
    <el-form ref="formRef" :model="setting" label-position="top">
      <el-form-item label="Category">
        <el-select v-model="setting.category" :placeholder="t('common_selectedIsRequiredMsg')"
                   @change="handleCategoryChange">
          <el-option v-for="item in categoryFields" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="setting.category == 'masterTable'" label="Master Table ID" required>
        <el-select v-model="setting.uniqueIdentifier">
          <el-option v-for="item in masterTableList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <div style="max-height: 550px">
      <h3>{{ $t('caseManage.fieldsLayout') }}</h3>

      <draggable class="list-group" :list="setting.columns" group="people" itemKey="id">
        <template #item="{ element, index }">
          <div class="list-group-item">
            <div class="topRow">
              <SvgIcon class="handle-icon" src="/icons/drag.svg" />
              {{ element.id }}
              <!--              <SvgIcon class="handle-icon" src="/icons/close.svg" @click="handleDeleteColumn(index)" />-->
            </div>
            <el-form label-position="top" class="row" size="small">
              <el-form-item label="Label">
                <el-input v-model="element.label" />
              </el-form-item>
              <el-form-item label="width">
                <el-input-number v-model="element.width" :min="80" :max="1000" />
              </el-form-item>
            </el-form>
          </div>
        </template>
      </draggable>
    </div>

    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="loading" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.list-group {
  min-height: 100px;
  overflow: auto;
}

.list-group-item {
  display: flex;
  flex-flow: column nowrap;
  // grid-template-columns: min-content 1fr min-content;
  background-color: #fff;
  padding: var(--app-space-xs);
  margin-bottom: var(--app-space-xs);

  .el-input {
    width: 100%;
  }

  .topRow {
    width: 100%;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
  }
}

.list-group-item--right {
  flex-flow: row nowrap;
  align-items: center;
}

.flex-zoom {
  display: grid;
  align-content: flex-start;
  row-gap: var(--app-space-xs);
  column-gap: var(--app-space-xs);

  .list-group-item {
    min-width: 100px;
    height: fit-content;
    gap: var(--app-space-xs);
    width: calc(var(--field-width, 50%) - var(--app-space-xs));
    --icon-size: 1.14rem;
    margin-bottom: unset;
  }
}

.processSetting-dialog {

}
</style>
