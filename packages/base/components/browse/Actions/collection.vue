<template>
  <div>
    <SvgIcon src="/icons/menu/collection.svg"
             :content="$t('tip.addToCollection')"
             round
             @click="handleClick(doc)"></SvgIcon>
    <el-dialog class="scroll-dialog" v-model="state.dialogOpened" append-to-body
               :close-on-click-modal="false">
      <template #title>
        <strong class="primaryTitle">{{ $t('tip.addToCollection') }}</strong>
      </template>
      <FormRenderer ref="FormRendererRef" :form-json="formJson" @handleSubmit="handleSubmit" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import formJson from './form/addToCollection.vform.json'
import { clientApi } from 'api'

const props = defineProps<{
  selectedList?: any,
  doc?: any,
}>()
const emits = defineEmits(['clearSelected'])
const state = reactive({
  loading: false,
  dialogOpened: false
})
const FormRendererRef = ref()

function handleClick(doc: any) {
  state.dialogOpened = true
  setTimeout(() => {
    initData()
  })
}

function initData() {
  const buttonRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('submit')
  buttonRef.setDisabled(false)

  const collectionRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('idOrPath')
  collectionRef.loadOptions(allCollectionList.value)
}

async function handleSubmit(collection) {
  try {
    const param = {
      documents: props.selectedList.map(item => ({ idOrPath: item.id })),
      collection
    }
    await clientApi.api.postDmsCollectionDocuments(param).then(r => r.data)
    state.dialogOpened = false
    ElMessage.success($i18n.t('dpMsg_success'))
    emits('clearSelected')
  } catch (error) {
    console.log(error)
  }
  initData()
}

const allCollectionList = ref([])

onMounted(async () => {
  const list = await clientApi.api.getDmsCollectionList().then(r => r.data) || []

  allCollectionList.value = list.map(item => {
    return { value: item.id, label: item.name }
  })
})
</script>