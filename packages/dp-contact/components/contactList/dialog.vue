<template>
  <el-dialog class="scroll-dialog" v-model="dialogOpened" append-to-body :close-on-click-modal="false">
    <FormVariablesRenderer ref="FormVariablesRendererRef"></FormVariablesRenderer>
    <template #footer>
      <el-button id="Browse__NewFolder__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const dialogOpened = ref(false)
const { t } = useI18n()
const props = defineProps<{
  id: string
}>()
const contacDetail = inject('contactDetailHelper')
const { contactBookDetail, attributesVForm } = toRefs(contacDetail)
const emits = defineEmits(['refresh'])
const state = reactive<any>({
  setting: {},
  loading: false
})
const FormVariablesRendererRef = ref()

async function handleSubmit() {
  try {
    state.loading = true
    const data = await FormVariablesRendererRef.value.getData()
    if (state.setting.id) {
      await newClientApi.putDmsContactGroupIdContactdetailContactdetailid(contactBookDetail.value.id, state.setting.id, data)
    } else {
      await newClientApi.postDmsContactGroupIdContactdetail(contactBookDetail.value.id, JSON.stringify(data))
    }
    emits('refresh')
    dialogOpened.value = false
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }
}

function handleOpen(initData: any) {
  console.log(initData)
  dialogOpened.value = true
  setTimeout(() => {
    init(initData)
  })
}

function init(initData: any) {
  state.setting = {}
  FormVariablesRendererRef.value.createJson(attributesVForm.value)
  if (initData) {
    state.setting = initData
    FormVariablesRendererRef.value.setData(initData)
  }
}

defineExpose({ handleOpen })
</script>
