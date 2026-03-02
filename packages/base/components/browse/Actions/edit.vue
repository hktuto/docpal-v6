<template>
  <div>
    <BrowseActionsButton id="editActionButton" :label="$t('tip.editDocDetail')" @click="openDialog">
      <el-tooltip :content="$t('tip.editDocDetail')">
        <SvgIcon id="Browse__Info__EditDetails" src="/icons/file/edit.svg" round
                 :label="$t('tip.editDocDetail')"></SvgIcon>
      </el-tooltip>
    </BrowseActionsButton>

    <el-dialog v-model="dialogOpened" append-to-body :title="$t('tip.editDocDetail')" class="scroll-dialog">
      <el-form ref="formRef" :model="form" label-width="120px" label-position="top" @submit.native.prevent>
        <el-form-item
          :label="$t('dpDocument_fileName')"
          prop="name"
          :rules="[{ required: true, message: $t('dpDocument_fileName') + $t('render.hint.fieldRequired'), trigger: 'change' }]"
        >
          <el-input v-model="form.name" clearable />
        </el-form-item>
      </el-form>
      <!--      <MetaRenderForm2 ref="MetaFormRef" :mode="state.MetaRenderMode"></MetaRenderForm2>-->
      <template #footer>
        <el-button id="Browse__EditDetails__Save" type="primary" :loading="state.loading" @click="handleSave"
                   @keyup.enter="handleSave">
          {{ $t('common_save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { emitBus, EventType } from 'eventbus'
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  doc?: any
  parentPath?: string
}>()
const emits = defineEmits(['success'])

const dialogOpened = ref(false)
const formRef = ref()
const form = ref({
  name: '',
  idOrPath: ''
})
const state = reactive({
  doc: {},
  loading: false,
  MetaRenderMode: 'ai-edit'
})
const MetaFormRef = ref()
const { t } = useI18n()

async function openDialog() {
  state.doc = props.doc
  form.value.name = props.doc.name
  dialogOpened.value = true
  // TODO：不再使用
  // nextTick(async () => {
  //   const analysis: any = await newClientApi.getDmsDocumentQueryaianalyzeIdorpath(props.doc.id).then(r => r.data)
  //   state.MetaRenderMode = checkLicenseFeatures('AI_CLASSIFICATION') && analysis.aiId ? 'ai-edit' : 'normal'
  //   const readonlyFields = props.doc.properties?.readonlyList || []
  //   const hiddenFields = props.doc.properties?.maskList || []
  //   await MetaFormRef.value.init(props.doc.type, {
  //     aiAnalysis: analysis.metaDatas,
  //     aiDocId: analysis.aiId,
  //     hiddenFields,
  //     readonlyFields
  //   })
  //   MetaFormRef.value.setData(props.doc.properties)
  // })
}

const getParentPath = (path: string): string => {
  const arr = path.split('/')
  arr.pop()
  return arr.join('/')
}

async function handleSave() {
  state.loading = true
  try {
    // const metaFormData = await MetaFormRef.value.getData()
    // if (!metaFormData) {
    //   return
    // }
    // check if the name is exist in the folder
    if (form.value.name !== props.doc.name) {
      const { isDuplicate } = await duplicateNameFilter(props.doc.parentRef, [form.value])
      if (isDuplicate) {
        ElMessage({
          message: t('dpTip_duplicateFileName') as string,
          type: 'error'
        })
        return
      }
    }
    await newClientApi.patchDmsDocument({
      idOrPath: props.doc.id,
      name: form.value.name
      // properties: metaFormData
    })
    ElMessage.success(t('tip_updateSuccessMsg', { modelName: t('common_item'), name: form.value.name }))

    emitBus(EventType.FILE_NEED_REFRESH, { relatedIdOrPath: props.doc.id })
    dialogOpened.value = false
  } catch (error: any) {
    console.error('edit fail', error)
  } finally {
    state.loading = false
  }
}

onMounted(async () => {
  // useEventListener(document, 'docActionRename', (event) => openDialog(event.detail))
})
defineExpose({ openDialog })
</script>
