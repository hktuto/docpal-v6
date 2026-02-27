<template>
  <el-dialog
    v-model="state.visible"
    :title="state.title"
    class="scroll-dialog"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <MasterTableVariableForm ref="FormVariablesRendererRef" :ignoreList="ignoreList" isAddRelation flexible />
    <template #footer>
      <div class="footer-grid">
        <el-button id="MasterTable__BatchEdit__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ t('common_submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const { t } = useI18n()
const props = withDefaults(
  defineProps<{
    ignoreList: any;
    tableId: string
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
  title: t('button.batchEdit'),
  rows: []
})
const route = useRoute()
const router = useRouter()

// #region module: submit
async function handleSubmit() {
  try {
    state.loading = true
    const data = await FormVariablesRendererRef.value.getData(true)
    if (!data) return
    const params: any = {
      data: [{ ...data }],
      in: { id: state.rows.map(item => item.id) }
    }
    if (data.relationRecords) {
      params.relationRecords = data.relationRecords
      delete params.data[0].relationRecords
    }
    await newClientApi.putDmsMasterTableIdBatchRecord(props.tableId, params)
    // console.log(params);
    emits('refresh')
    state.visible = false
  } catch (error) {

  } finally {
    state.loading = false
  }
}

// #endregion

const FormVariablesRendererRef = ref()

async function handleOpen(fields, rows) {
  state.visible = true
  state.loading = false
  state.rows = deepCopy(rows)
  state.fields = fields
  setTimeout(() => {
    initForm(state.rows[0])
  })
}

function initForm(row: any) {
  console.log(state.fields)
  FormVariablesRendererRef.value.init(state.fields, row)
}

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
