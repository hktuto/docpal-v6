<template>
  <el-dialog
    v-model="state.visible"
    :title="$t('dashboard.setting')"
    class="scroll-dialog masterTableInfoSetting-dialog big"
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="state.setting" label-position="top">
      <el-form-item :label="$t('masterTable_masterName')" prop="masterTableId" required>
        <el-select v-model="state.setting.masterTableId" filterable :placeholder="$t('masterTable_masterName')" @change="handleMasterTableChange">
          <el-option v-for="item in state.masterTables" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('common_title')" prop="title" required>
        <el-input v-model="state.setting.title" :placeholder="$t('common_title')" />
      </el-form-item>
      <el-form-item :label="$t('masterTable_id')" prop="relatedField" required>
        <el-select v-model="state.setting.relatedField" filterable allow-create :placeholder="$t('masterTable_id')">
          <el-option v-for="item in state.caseFields" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="layout-left">
      <h3>{{ $t('caseManage.fieldsLayout') }}</h3>
      <draggable class="list-group flex-zoom" :list="state.setting.layout" group="people" itemKey="id">
        <template #item="{ element, index }">
          <div :style="`--field-width: ${element.width}`" class="list-group-item">
            <div class="topRow">
              <SvgIcon class="handle-icon" src="/icons/drag.svg" />
              {{ element.name }}
              <el-dropdown @command="(command: string) => handleCommand(command, element)">
                <SvgIcon class="zoom-icon" src="/icons/tools/zoom.svg" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="item in widthList" :key="item.width" :command="item.width">{{ item.width }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <ElForm label-position="top" class="row" size="small">
              <ElFormItem label="Default value">
                <el-input v-model="element.defaultValue" />
              </ElFormItem>
              <ElFormItem label="Label">
                <el-input v-model="element.label" />
              </ElFormItem>
              <ElFormItem v-if="element.dataType === 'varchar'" label="Link type">
                <el-select v-model="element.linkType" clearable placeholder="Select link type">
                  <el-option key="document" label="Document" value="document" />
                  <el-option key="workflow" label="Workflow" value="workflow" />
                  <el-option key="case" label="Case" value="case" />
                </el-select>
              </ElFormItem>
            </ElForm>
          </div>
        </template>
      </draggable>
    </div>
    <div class="avalibleFields layout-right">
      <h3>{{ $t('caseManage.avalibleFields') }}</h3>
      <ElInput v-model="filterText" placeholder="Filter" class="filter-input" />
      <draggable class="list-group" :list="filterList" group="people" itemKey="id">
        <template #item="{ element, index }">
          <div class="list-group-item list-group-item--right">
            <SvgIcon class="handle-icon" src="/icons/drag.svg" />
            {{ element.name }}
          </div>
        </template>
      </draggable>
    </div>
    <template #footer>
      <div class="footer-grid">
        <el-button type="primary" :loading="state.loading" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import draggable from 'vuedraggable'
import { newClientApi } from 'api'
const emits = defineEmits(['refresh', 'delete'])
const { t } = useI18n()
const caseProvider: any = inject(CaseManagementDashboardKey)
const filterText = ref('')
const filterList = computed(() => {
  console.log('filterList', state.masterTableFields, state.setting.layout)
  return state.masterTableFields
    .filter((item: any) => {
      return !filterText.value || item.name.toLowerCase().includes(filterText.value.toLowerCase())
    })
    .filter((item: any) => !state.setting.layout.find((l: any) => item.name === l.name))
})

const widthList = [
  { width: '25%', label: '25%' },
  { width: '33%', label: '33%' },
  { width: '50%', label: '50%' },
  { width: '66%', label: '66%' },
  { width: '75%', label: '75%' },
  { width: '100%', label: '100%' }
]
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: {},
  masterTables: [],
  masterTableFields: [],
  caseFields: []
})
const formRef = ref()
async function handleSubmit() {
  state.loading = true
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    emits('refresh', state.setting)
    state.visible = false
  } catch (error) {
    state.loading = false
  } finally {
    state.loading = false
  }
}
async function initOptions() {
  const { data } = await newClientApi.getDmsMasterTable({
    data: {
      type: 'all'
    }
  })
  state.masterTables = data.map((item: any) => ({
    value: item.id,
    label: item.name
  }))

  getCaseFields()
}
async function getCaseFields() {
  const versionId = caseProvider.versionId?.value || null``
  if (versionId) {
    const data = await newClientApi.getCaseDashboardVersionVersionidPrimaryform(versionId).then(r =>r.data)
    state.caseFields = data.fields
      .map((item: any) => ({
        value: item.id,
        label: item.name
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label))
  }
}
async function handleMasterTableChange(value: string, isInit: boolean = false) {
  const curItem = state.masterTables.find((item: any) => item.value === value)
  if (!!curItem) {
    state.setting.masterTableName = curItem.label
    state.setting.title = curItem.label
  }
  const { data } = await newClientApi.getDmsMasterTableId(value)
  state.masterTableFields = data.fields
    .map((item: any) => ({
      ...item,
      name: item.columnName,
      label: item.columnName,
      width: '100%'
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
  if (!isInit) state.setting.layout = state.setting.layout.filter((item: any) => state.masterTableFields.find((l: any) => l.name === item.name))
}
function handleOpen(setting: any) {
  state.visible = true
  setTimeout(async () => {
    await formRef.value.resetFields()
    if (!setting.layout) setting.layout = []
    if (!setting.label)
      setting.label = setting.layout.reduce((prev: any, item: any) => {
        prev[item.id] = item.name
        return prev
      }, {})
    state.setting = deepCopy(setting)
    state.loading = false
    if (!!state.setting.masterTableId) handleMasterTableChange(state.setting.masterTableId, true)
  })
}

function handleCommand(command: string, row: any) {
  row.width = command
}
onMounted(() => {
  initOptions()
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.list-group {
  min-height: 200px;
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
  display: flex;
  flex-wrap: wrap;
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
</style>
<style lang="scss">
.masterTableInfoSetting-dialog {
  .el-dialog__body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: min-content 1fr;
    grid-column-gap: var(--app-space-xs);
    grid-row-gap: var(--app-space-xs);
    overflow: auto;
    .el-form {
      grid-area: 1 / 1 / 2 / 3;
    }
    .layout-left {
      grid-area: 2 / 1 / 3 / 2;
    }
    .layout-right {
      grid-area: 2 / 2 / 3 / 3;
    }
    .layout-left,
    .layout-right {
      background-color: #f2f8f9;
      padding: var(--app-space-xs);
      display: grid;
      grid-template-rows: min-content 1fr;
      overflow: hidden;
    }
    .layout-right {
      grid-template-rows: min-content min-content 1fr;
      .filter-input {
        margin-bottom: var(--app-space-xs);
      }
    }
  }
}
</style>
