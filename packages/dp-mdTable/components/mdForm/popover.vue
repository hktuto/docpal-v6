<template>
  <el-dialog v-model="visible" class="scroll-dialog" @close="resetForm">
    <template v-if="mode === 'edit'" #header>
      <div class="el-dialog__title mdForm-title">
        {{ title }}
        <el-button class="source-button" type="info" link :icon="Position" v-if="showSourceButton" @click="handleSourceClick"> Go to Source Table </el-button>
        <div v-if="showMoveButtons">
          <el-icon
            style="font-size: var(--app-font-size-m)"
            :class="disabledUp ? 'cursor-not-allowed' : 'cursor-pointer'"
            :disabled="disabledUp"
            @click="handleMove('up')"
          >
            <Top />
          </el-icon>
          <el-icon
            style="font-size: var(--app-font-size-m)"
            :class="disabledDown ? 'cursor-not-allowed' : 'cursor-pointer'"
            :disabled="disabledDown"
            @click="handleMove('down')"
          >
            <Bottom />
          </el-icon>
        </div>
      </div>
    </template>
    <MdForm ref="formRef" :columns="formColumns" :systemFieldsTypes="systemFieldsTypes" :form-data="formData" :mode="mode" />
    <template #footer>
      <div class="form-actions">
        <el-button @click="handleCancel">{{ $t('cancelText') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { newClientApi } from 'api'
import { EventType, useEventBus } from 'eventbus'
import { Top, Bottom, Position } from '@element-plus/icons-vue'
import { updateRelationFields } from '../../utils/relationHelper'
const { updateRow } = useTableDataInject()
const viewTools = inject('viewTools')
const { navigateToTableMenu } = viewTools
const visible = ref(false)
const formData = ref<any>({})
const mode = ref('edit')
const props = defineProps<{
  showMoveButtons: boolean
  showSourceButton: boolean
  columns: any[]
  tableId: string
  systemFieldsTypes: any[]
}>()
const emits = defineEmits(['submit'])
const { t } = useI18n()
const title = ref(t('common_edit'))
const { currentRow, setCurrentRow, moveCurrentRow, disabledUp, disabledDown } = useCurrentRow()
const formColumns = ref<any[]>([])
const resetForm = () => {
  console.log('resetForm')
}
function handleCancel() {
  visible.value = false
}
const formRef = ref()
const relationRefreshBus = useEventBus(EventType.RELATION_NEED_REFRESH)
/**
 * 处理关系表单数据刷新
 * @param payload { data: any, relationTableId: string, relationRowId: string, relationField: string }
 */
const stopRelationRefresh = relationRefreshBus.on((payload: any) => {
  if (props.showSourceButton) return
  if (!visible.value) return
  if (payload?.data) {
    updateRelationFields(payload.relationRowId, payload.data, formData.value, payload.relationField)
  }
})
onBeforeUnmount(() => {
  stopRelationRefresh()
})

async function handleSubmit() {
  const _formData = await formRef.value.getFormData()
  if (!_formData) return
  visible.value = false
  emits('submit', _formData, formData.value.id)
}
async function open(row: any, _mode: 'default' | 'edit' = 'default', _title: string = '') {
  formData.value = JSON.parse(JSON.stringify(row))
  mode.value = _mode

  visible.value = true
  if (props.showMoveButtons) setCurrentRow(row)
  if (_title) {
    title.value = _title
  } else {
    title.value = t('common_edit')
  }
  await getFormColumns()
}
function handleMove(direction: 'up' | 'down') {
  moveCurrentRow(direction)
  formData.value = { ...currentRow.value }
}
const close = () => {
  visible.value = false
}
async function getFormColumns() {
  if (props.columns && props.columns.length > 0) {
    formColumns.value = props.columns
  } else {
    const res: any = await newClientApi.getDocpalMasterTableUserConfig({ tableId: props.tableId, userId: 'master' })
    const configStr = res.data.tableConfig
    const config = configStr ? JSON.parse(configStr) : []
    let result = []
    const displayFieldsInFirstView = config.length > 0 ? (config[0].columns.length > 0 ? config[0].columns : res.data.tableFields) : res.data.tableFields
    if (config.length > 0 && config[0].columns.length > 0) {
      displayFieldsInFirstView.forEach((field: any) => {
        const fieldItem = res.data.tableFields.find((item: any) => item.id === field.id)
        if (fieldItem) {
          result.push({ ...fieldItem, ...field })
        }
      })
    } else {
      result = res.data.tableFields
    }
    formColumns.value = result
  }
}
function handleSourceClick() {
  navigateToTableMenu(props.tableId)
}

defineExpose({ open, close })
</script>

<style scoped lang="scss">
.mdForm-title {
  display: flex;
  justify-content: space-between;
}
.cursor-not-allowed {
  cursor: not-allowed;
  color: var(--app-grey-400);
}

.source-button {
  font-size: var(--app-font-size-m);
}
</style>
