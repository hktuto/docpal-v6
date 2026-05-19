<template>
  <div>
    <SvgIcon src="/icons/file/newFolder.svg"
             content="tip.new_folder"
             round
             @click="iconClickHandler(doc)"></SvgIcon>
    <el-dialog class="scroll-dialog" v-model="dialogOpened" append-to-body :close-on-click-modal="false">
      <template #header>
        <strong class="primaryTitle">{{ $t('filePopover_newFolder') }}</strong>
        {{ 'in /' + state.doc.name }}
      </template>
      <FormRenderer :ref="(el) => FormRendererRef = el" :form-json="formJson" @formChange="formChange" />
      <MetaRenderForm2 ref="MetaFormRef"></MetaRenderForm2>
      <template #footer>
        <el-button id="Browse__NewFolder__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
          {{ $t('submit') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { useEventListener } from '@vueuse/core'
import { emitBus, EventType } from 'eventbus'
import { newClientApi } from 'api'
import { duplicateNameFilter } from '../../../../packages/base/utils/browseHelper'

const dialogOpened = ref(false)
const { t } = useI18n()
const props = defineProps<{
  doc?: any,
  selected?: any[]
}>()
const emits = defineEmits(['success'])
const state = reactive<any>({
  loading: false,
  docPath: '',
  doc: {}
})
const FormRendererRef = ref()
const MetaFormRef = ref()

function iconClickHandler(doc: any) {
  dialogOpened.value = true
  state.dialogOpened = ''
  state.docPath = doc.path
  state.doc = doc
  // open upload dialog
  setTimeout(() => {
    handleReset()
  })

}

import formJson from './form/fileNewFolder.vform.json'

function formChange({ fieldName, newValue, oldValue, formModel }) {
  if (fieldName === 'type') MetaFormRef.value.init(newValue)
  // if(fieldName === 'type') MetaFormRef.value.initMeta(newValue)
}

async function handleSubmit() {
  try {
    const timestamp = new Date().valueOf()
    const metaFormData = await MetaFormRef.value.getData()
    if (!metaFormData) return
    const data = await FormRendererRef.value.getFormData()
    data.name = data.name.trim()
    if (!data.name) {
      ElMessage.error(t('render.hint.fieldRequired', { name: t('related_name') }))
      return
    }

    const parentPath = state.docPath === '/' ? '' : state.docPath
    state.loading = true
    const params = {
      ...data,
      properties: metaFormData,
      // idOrPath: `${parentPath}/new Folder${timestamp}`,
      idOrPath: `${parentPath}/${data.name}`
    }

    const { isDuplicate } = await duplicateNameFilter(state.doc.path, [data])
    if (isDuplicate) {
      throw new Error('dpTip.newFolderDuplicateName')
    }
    const newDoc = await newClientApi.postDmsDocumentFolder(params).then(r => r.data)
    dialogOpened.value = false
    emitBus(EventType.FILE_NEED_REFRESH, {
      relatedIdOrPath: newDoc.parentRef,
      highlightIdOrPath: newDoc.id
    })
    // // check if state.doc id Folder , if so , need to refresh folder and folder parent.
    // if(state.doc.isFolder) {
    //     let parentRef = state.doc.parentRef
    //     if(!parentRef){
    //         // get document detail
    //         const {data:parentDoc} = await newClientApi.postDmsDocumentFetch({idOrPath: state.doc.id}) as any
    //         parentRef = parentDoc.parentRef
    //     }
    //     emitBus(EventType.FILE_NEED_REFRESH, {
    //         relatedIdOrPath: parentRef,
    //         highlightIdOrPath:  newDoc.id
    //     })
    // }

    // emits('success', state.doc)
    state.loading = false
  } catch (error) {
    if (error.message === 'dpTip.newFolderDuplicateName') {
      ElMessage({
        message: t(error.message) as string,
        type: 'error'
      })
    }
    console.log('error', error)
    state.loading = false
  }

}

function handleReset() {
  if (FormRendererRef.value.vFormRenderRef) {
    FormRendererRef.value.vFormRenderRef.resetForm()
    const typeRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('type')
    typeRef.setValue('Folder')
    nextTick(() => {
      const nameRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('name')
      if (nameRef?.focus) {
        nameRef.focus()
      }
      if (nameRef?.$refs?.fieldEditor?.select) {
        nameRef?.$refs?.fieldEditor?.select()
      }
    })
  }
}

onMounted(() => {
  useEventListener(document, 'docActionAddFolder', (event) => iconClickHandler(event.detail))
})
defineExpose({ iconClickHandler })
</script>
