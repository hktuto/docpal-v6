<template>
  <div>
    <el-dialog v-model="dialogOpened" append-to-body :title="$t('filePopover_rename')" class="scroll-dialog">
      <el-form ref="formRef" :model="form" label-width="120px" label-position="top" @submit.native.prevent>
        <el-form-item :label="$t('tableHeader_name')" prop="name"
                      :rules="[ { required: true, message: $t('tableHeader_name') + $t('render.hint.fieldRequired'), trigger: 'change'}]">
          <el-input v-model="form.name" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button id="Browse__Rename__Save" type="primary" :loading="state.loading" @click="handleSave"
                   @keyup.enter="handleSave">
          {{ $t('common_save') }}
        </el-button>
      </template>
    </el-dialog>
    <!-- -->
  </div>
</template>

<script lang="ts" setup>
import { emitBus, EventType } from 'eventbus'
import { useEventListener } from '@vueuse/core'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const props = defineProps<{
  doc?: any,
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

async function openDialog(detail: any) {
  state.doc = detail
  form.value.name = detail.name
  form.value.id = detail.id
  form.value.path = detail.path
  dialogOpened.value = true
  nextTick(async () => {
    const data = await clientApi.api.getDmsDocumentQueryaianalyzeIdorpath(state.doc.id).then(r => r.data)
    const metadatas = data.metaDatas.reduce((prev: any, item) => {
      if (item.label || item.value) {
        prev[item.name] = {}
        if (item.label) prev[item.name].label = item.label
        if (item.value) prev[item.name].value = item.value
      }
      return prev
    }, {})
    const analysis = {
      aiId: data.aiId,
      metaDatas: metadatas
    }
    // state.MetaRenderMode = checkLicenseFeatures('AI_CLASSIFICATION') && analysis.aiId ? 'ai-edit' : 'normal'
    // await MetaFormRef.value.init(props.doc.type, {
    //     aiAnalysis: analysis.metaDatas,
    //     aiDocId: analysis.aiId
    // })
    // MetaFormRef.value.setData(props.doc.properties)
  })
}

async function handleSave() {
  state.loading = true
  const detail = await clientApi.api.postDmsDocumentFetch({ idOrPath: state.doc.id }).then(res => res.data)

  try {
    // check if the name is exist in the folder
    const { isDuplicate } = await duplicateNameFilter(detail.parentRef, [form.value])

    if (isDuplicate && form.value.name !== state.doc.name) {
      ElMessage.error(t('dpTip.duplicateFileName2'))
      state.loading = false
      return
    }
    await clientApi.api.patchDmsDocument({
      idOrPath: form.value.id,
      name: form.value.name
    })
    dialogOpened.value = false
    emits('success', state.doc)
  } catch (error) {
    console.log(error)
  } finally {
    console.log('finally', state.doc)
    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: detail.parentRef,
      highlightIdOrPath: state.doc.id
    })
  }
  state.loading = false
}

useEventListener(document, 'docActionRename', (event) => openDialog(event.detail))

defineExpose({ openDialog })
</script>