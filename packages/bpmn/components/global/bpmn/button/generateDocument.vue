<script lang="ts" setup>
import { ElButton } from 'element-plus'
import { clientApi, templateApi } from 'api'

const routerProvider = inject(MenuRouterKey)

const props = defineProps<{
  xml: string,
  taskDetail: any
  formData: any,
  attr_documentStepId: string
  attr_previewButtonText: string
}>()

const loading = ref(false)
const opened = ref()
const userId = useUserId()
const workflowFormDetail = inject('workflowFormRender')
const previewFile = reactive<{
  name: string,
  blob: Blob | null
}>({
  name: '',
  blob: null
})
const dialogOpened = ref(false)

const dialogHeight = ref(640)

async function generateOldTemplate(templateId: string, map: any) {
  const res: any = await clientApi.api.postDmsTemplateDocumentGenerateFile({
    templateId: templateId,
    paramsMap: map
  }, {
    format: 'blob'
  })
  return res
}

async function generateNewTemplatePreview(templateId: string, map: any) {

  try {
    // try to get template detail 
    const templateDetail = await clientApi.api.getDmsTemplateEmailTemplateId(templateId).then(r => r.data)

    if (!templateDetail) {
      return
    }
    if (templateDetail.fileType !== 'Word') {
      await generateOldTemplate(templateId, map)
    }
    const res = await clientApi.api.postDmsDocumentPreview({
      idOrPath: templateDetail.documentId
    })
    if (typeof res !== 'object') {
      await generateOldTemplate(templateId, map)
    }
    // now we confirm it is new template
    // change map.system_output_file_type to pdf for preview
    map.system_output_file_type = 'pdf'
    const blob = await templateApi.convert.postConvertGeneratefilefromdata({
      data: map,
      template: res
    }, {
      format: 'blob'
    })
    console.log('blob', blob)
    return blob
  } catch (e) {
    console.log('e', e)
    throw new Error('Generate Preview Error')
  }
}

async function generatePreview() {
  try {
    loading.value = true
    previewFile.blob = null
    const xmlJson = bpmnStringToJson(props.xml)
    const targetTask = xmlJson.flatObj[props.attr_documentStepId]
    const latestFormData = await workflowFormDetail?.getFormData(false)
    console.log('latestFormData', latestFormData)
    // merge latestFormData and props.formData, if item in object is null, use latestFormData
    // merge form data and latest form data keys
    const mergeKeys = [...new Set([...Object.keys(props.formData), ...Object.keys(latestFormData)])]
    const mergeFormData = mergeKeys.reduce((prev: any, key: string) => {
      if (latestFormData[key]) {
        prev[key] = latestFormData[key]
      } else if (props.formData[key]) {
        prev[key] = props.formData[key]
      }
      return prev
    }, {})
    console.log('mergeFormData', mergeFormData)
    // get template id
    const templateId = targetTask.extensionElements['flowable:field'].find((field: any) => field.attr_name === 'templateId')

    if (!templateId) return
    const templateIdValue = templateId['flowable:expression']['__cdata']
    const defaultField: any = ['parentPath', 'storeValue', 'documentName', 'documentType', 'templateId']
    const workflowToTemplateMapping: any = (targetTask.extensionElements['flowable:field'] || []).filter((item: any) => !defaultField.includes(item.attr_name))
      .map((item: any) => ({
        key: item.attr_name,
        value: item['flowable:expression'].__cdata.replace('${variables:get(', '').replace(')}', '')
      }))
    console.log('workflowToTemplateMapping', workflowToTemplateMapping)
    // create mapping 
    let map: any = {}
    console.log('workflowToTemplateMapping', workflowToTemplateMapping.length)
    workflowToTemplateMapping.forEach((obj: any) => {
      if (obj) {
        const value = mergeFormData[obj.value]
        if (value) {
          try {
            let data = JSON.parse(value)
            if (typeof data === 'number') {
              console.log(' number data', data)
              data = data.toFixed(2)
            }
            map[obj.key] = data
          } catch (err) {

            map[obj.key] = value
          }
        } else {
          map[obj.key] = ' '
        }
      }
    })
    console.log('map', map)
    return await generateNewTemplatePreview(templateIdValue, map)
    // 
  } catch (err: any) {
    console.log(err)
    if (err.name !== 'AxiosError') {
      routerProvider?.message.error(err.message)
    }
    throw new Error('Generate Preview Error')
  } finally {
    loading.value = false
  }
}

async function openPreivew() {
  const res = await generatePreview()
  dialogHeight.value = window.innerHeight - 60
  dialogOpened.value = true
  setTimeout(() => {
    if (res) {
      previewFile.blob = res
    }
  }, 100)
}

function init() {

}

async function beforeSubmit() {
  // // because backend can not handle loop data in workflow generate template, so we need to upload file to server
  // const res = await generatePreview() as blob
  // // will set default file name to 'preview'
  // // default filed name is 'file'
  // // get  file extension from blob
  // const ext = mimeTypeToExtension(res.type)


  // const fileName = 'preview' + Date.now() + '.'+ ext
  // // return null 
  // const formData = new FormData()

  // const params = {
  //   type:"File",
  //   properties: {
  //     'dc:title': fileName
  //   },

  // }
  // formData.append('document', JSON.stringify(params))
  // formData.append('file', res, fileName)
  // formData.append('nonPermission', true)

  // const uploadRes = await clientApi.instance.post('/docpal/workflow/upload/file', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data'
  //   }
  // }).then(res => res.data.data)
  // console.log("res", uploadRes.id)
  // return {
  //   file: uploadRes.id,
  //   hasFile: true
  // }
}

onMounted(() => {
  init()
})
// defineExpose({ beforeSubmit })
</script>

<template>
  <ElButton type="primary" :loading="loading" @click="openPreivew">{{ props.attr_previewButtonText }}</ElButton>
  <ElDialog v-model="dialogOpened" class="big" width="90%" height="90%" :align-center="true" append-to-body>
    <div class="readerContainer" :style="`--height: ${dialogHeight}px`">
      <Reader v-if="previewFile.blob" v-bind="previewFile" />
    </div>
  </ElDialog>
</template>

<style lang="scss" scoped>

.readerContainer {
  width: 100%;
  height: var(--height);
  overflow: auto;
}
</style>
