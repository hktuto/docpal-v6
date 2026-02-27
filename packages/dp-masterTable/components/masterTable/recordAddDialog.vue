<template>
  <el-dialog v-model="state.visible" :title="state.title" class="scroll-dialog" append-to-body
             :close-on-click-modal="false" destroy-on-close @close="handleClose">
    <MasterTableVariableForm ref="FormVariablesRenderer" :ignoreList="ignoreList" />
    <template #footer>
      <div class="footer-grid">
        <el-button id="MasterTable__Tables__Detail__Add__Submit" type="primary" :loading="state.loading"
                   @click="handleSubmit">
          {{ t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { globalApi } from 'api'

const { t } = useI18n()
const props = withDefaults(defineProps<{
  tableId: string,
  ignoreList: string[],
}>(), {
  ignoreList: []
})
const emits = defineEmits([
  'refresh', 'delete'
])
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
    const data = await FormVariablesRenderer.value.getData(true)
    if (state.edit) {
      await globalApi.putDmsMasterTableIdRecord(props.tableId, {
        data: [data],
        where: {
          id: state.setting.id
        }
      })
    } else {
      await globalApi.postDmsMasterTableRecord({
        id: props.tableId,
        data: [data]
      })
    }
    state.visible = false
    emits('refresh')
  } catch (error) {
  } finally {
    state.loading = false
  }
}

const FormVariablesRenderer = ref()

async function handleOpen(fields, row?) {
  state.visible = true
  state.loading = false
  if (row) {
    state.edit = true
    state.setting = row
    state.title = t('masterTable.editRow')
  } else {
    state.edit = false
    state.title = t('masterTable.newRow')
  }
  setTimeout(() => {
    FormVariablesRenderer.value.init(fields, row)
  })
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
