<template>
  <el-dialog v-model="state.visible" :title="state.title" class="scroll-dialog" :close-on-click-modal="false">
    <FormVariablesRenderer ref="FormVariablesRendererRef" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="MasterTable__Tables__Detail__Records__Edit__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { globalApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    tableId: string
    ignoreList: string[]
  }>(),
  {
    ignoreList: []
  }
)
const emits = defineEmits(['refresh', 'delete'])
const state = reactive({
  loading: false,
  visible: false,
  setting: {},
  fields: [],
  edit: false,
  title: t('masterTable.newRow')
})

async function handleSubmit() {
  try {
    state.loading = true
    const data = await FormVariablesRendererRef.value.getData(true)
    if (!data) return
    let msg
    if (state.edit) {
      await globalApi.putDmsMasterTableIdRecord(props.tableId, {
        data: [data],
        where: {
          id: state.setting.id
        }
      })
      msg = t('tip_updateMsg', { modelName: t('common_row'), name: null })
    } else {
      await globalApi.postDmsMasterTableRecord({
        id: props.tableId,
        data: [data]
      })
      msg = t('tip_createdSuccessMsg', { modelName: t('common_row'), name: null })
    }
    ElMessage.success(msg)
    state.visible = false
    emits('refresh')
  } catch (error) {
    // no need to handle error,
    // because FormVariablesRendererRef and api handle all error already.
  } finally {
    state.loading = false
  }
}

async function turnFields(fields) {
  const typeMap: any = {
    varchar: 'input',
    json: 'json-editor',
    'VARCHAR:255': 'textarea',
    'varchar:4000': 'textarea',
    clob: 'textarea',
    long: 'textarea',
    text: 'textarea',
    bigint: 'int',
    timestamp: 'date',
    bit: 'switch',
    decimal: 'number',
    Relation: 'select'
  }
  const resultFields: any = []
  const pList: any = []
  fields.forEach(async (item: any) => {
    if (!props.ignoreList.find((iItem) => iItem === item.columnName)) {
      const type = typeMap[item.dataType] || 'input'
      const _item: any = {
        name: item.columnName,
        label: item.columnName,
        type: type,
        required: item.required,
        options: {}
      }

      if (item.relationTable) {
        pList.push(
          getRelationOptions(
            {
              relationTable: item.relationTable,
              relationField: item.relationField,
              displayField: item.displayField
            },
            _item
          )
        )
        return
      } else if (item.dataType === 'varchar') {
        _item.maxLength = item.length
        if (item.length > 255) _item.type = 'textarea'
      } else if (item.dataType === 'bigint') {
        _item.type = 'number'
        _item.options.stepStrictly = true
        _item.options.customClass = ['align-left']
        _item.options.precision = 0
      } else if (item.dataType === 'json') {
        // _item.type = 'textarea'
        // _item.options.maxLength = ''
      }
      resultFields.push(_item)
    }
  })
  await Promise.all(pList)
  return resultFields

  async function getRelationOptions(params, field) {
    const data = await globalApi.getDmsMasterTableRecords(params).then((res) => res.data)
    field.type = 'select'
    field.options.optionItems = data?.map((item) => ({
      label: item[params.displayField],
      value: item[params.relationField]
    }))
    field.options.filterable = true
    const index = resultFields.findIndex((item) => item.name === field.name)
    if (index !== -1) resultFields.splice(index, 1, field)
    else resultFields.push(field)
  }
}

const FormVariablesRendererRef = ref()

async function handleOpen(fields: any, row?: any) {
  state.visible = true
  state.loading = false
  state.fields = await turnFields(fields)
  setTimeout(async () => {
    FormVariablesRendererRef.value.createJson(state.fields)
    if (row) {
      state.edit = true
      state.setting = row
      FormVariablesRendererRef.value.setData(row)
      state.title = t('masterTable.editRow')
    } else {
      state.edit = false
      state.title = t('masterTable.newRow')
      FormVariablesRendererRef.value.setData({})
    }
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
