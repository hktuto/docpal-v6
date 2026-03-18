<template>
  <el-dialog v-model="state.visible" :title="$t('common_filter')" :append-to-body="appendToBody" :close-on-click-modal="false" @close="state.visible = false">
    <FormVariablesRenderer ref="formVariablesRendererRef" />
    <template #footer>
      <el-button type="danger" @click="handleClear">{{ $t('common_clear') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ $t('confirm') }}</el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi, PostgREST_Decorate } from 'api'
const props = withDefaults(
  defineProps<{
    setting?: any
  }>(),
  {
    setting: {}
  }
)
const appendToBody = ref(true)
const emits = defineEmits(['filter'])
const state = reactive({
  visible: false
})
const formVariablesRendererRef = ref()
async function handleOpen(sqlParams?: any) {
  state.visible = true
  const fields = JSON.parse(props.setting.fields)
  console.log("document.fullscreenElement", document.fullscreenElement)
  appendToBody.value = document.fullscreenElement ? false : true
  const formList = []
  for (const item of props.setting.filterDialogList) {
    const filterItem = fields.find((field: any) => field.value === item.filterDialogField)
    if (filterItem.type === 'date') {
      formList.push({
        name: item.filterDialogField,
        label: filterItem.label,
        type: 'date',
        options: {
          format: 'YYYY-MM-DD',
          valueFormat: 'YYYY-MM-DD'
        }
      })
    } else if (filterItem.type === 'boolean') {
      formList.push({
        name: item.filterDialogField,
        label: filterItem.label,
        type: 'select',
        options: {
          optionItems: [
            { label: 'Yes', value: true },
            { label: 'No', value: false }
          ]
        }
      })
    } else {
      formList.push({
        name: item.filterDialogField,
        label: filterItem.label,
        type: 'select',
        options: {
          optionItems: await getOptions(item.filterDialogField)
        }
      })
    }
  }
  formVariablesRendererRef.value.createJson(formList)
  if (sqlParams) {
    const initData = {}
    sqlParams.forEach((item: any) => {
      initData[item.key] = item.value
    })
    formVariablesRendererRef.value.setData(initData)
  }
}
async function getOptions(filterKey: string) {
  const sqlParams = [
    {
      type: 'select',
      value: filterKey
    }
  ]
  const sql = PostgREST_Decorate(sqlParams)
  console.log(2222,props.setting)
  const response = await clientApi.api.getPostgrestTable(`${props.setting.tableName}?${sql}`)
  const options = response.data.map((item: any) => item[filterKey])
  const uniqueOptions = [...new Set(options)]
  return uniqueOptions.map((item: any) => ({
    label: item,
    value: item
  }))
}

async function handleSubmit() {
  const data = await formVariablesRendererRef.value.getData()
  const sqlParams = []
  Object.keys(data).forEach((key: string) => {
    if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
      sqlParams.push({
        key: key,
        type: 'eq',
        value: data[key]
      })
    }
  })
  emits('filter', sqlParams)
  state.visible = false
}
function handleClear() {
  formVariablesRendererRef.value.FormRendererRef.vFormRenderRef.resetForm()
}
defineExpose({ handleOpen })
</script>
<style lang="scss"></style>
