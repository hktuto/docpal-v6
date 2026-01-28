<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { clientApi } from 'api'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}

const allTemplate = ref<any[]>([])
const template_name = ref<string>('')

const variables = ref<any[]>([])

const allFields = computed(() => {
  if (!graphProvider?.allFormField.value) return []
  return graphProvider?.allFormField.value
})

function refreshData() {
  // get template_name
  const data = node.getData()
  variables.value = []
  if (data.data.extensionElements['flowable:field']) {
    const index = data.data.extensionElements['flowable:field'].findIndex((item: any) => item.attr_name === 'template_name')
    if (index === -1) {
      template_name.value = ''
    } else {
      console.log(data.data.extensionElements['flowable:field'][index])
      template_name.value = data.data.extensionElements['flowable:field'][index]['flowable:string']['__cdata']
    }
    const allVariable = data.data.extensionElements['flowable:field'].filter((item: any) => !(item.attr_name === 'template_name'))
    console.log('allVariable', allVariable, data.data.extensionElements['flowable:field'])
    // check 'tos' is exist, if not , add in front of allVariable
    if (!allVariable.find((item: any) => item.attr_name === 'tos')) {
      allVariable.unshift({
        attr_name: 'tos',
        'flowable:expression': {
          '__cdata': ''
        }
      })
    }
    // variable cdata is wrap by ${variables:get(variable)}

    allVariable.forEach((item: any) => {
      variables.value.push({
        attr_name: item.attr_name,
        cdata: item['flowable:expression'].__cdata.replace('${variables:get(', '').replace(')}', '')
      })
    })
  } else {
    template_name.value = ''
  }

}

async function searchTemplte(keyword: string = '') {
  const data = await clientApi.admin.postAdmindocpalMessageTemplateList({
    name: keyword,
    pageSize: 1000,
    pageNum: 0
  }).then(r => r.data)
  console.log('searchTemplte', data)
  allTemplate.value = data.entryList || []
}

async function template_nameChanged(newVal: string) {
  const data = node.getData()
  const detailItem = allTemplate.value.find((item: any) => item.templateName === newVal)
  // get template detail by template_name
  const templateDetail = await clientApi.admin.getAdmindocpalMessageTemplateDetailsId(detailItem.id).then(r => r.data)
  console.log('templateDetail', templateDetail)
  const allVariableInTemplate = [
    ...templateDetail.template.headerParameters || [],
    ...templateDetail.template.bodyParameters || [],
    ...templateDetail.template.textParameters || []
  ]
  data.data.extensionElements['flowable:field'] = [
    {
      attr_name: 'template_name',
      'flowable:string': {
        '__cdata': newVal
      }
    },
    ...allVariableInTemplate.map((item: any) => ({
      attr_name: item.name,
      'flowable:expression': {
        '__cdata': ''
      }
    }))
  ]
  node.setData({
    ...data,
    version: node.data.version + 1 || 0
  }, {
    overwrite: true,
    deep: true
  })
  refreshData()
  // if(index === -1) {
  //     data.data.extensionElements['flowable:field'].push({
  //         "attr_name": "template_name",
  //         "flowable:string": {
  //             "__cdata": newVal
  //         }
  //     })

  // }else{
  //     data.data.extensionElements['flowable:field'][index] = {
  //         "attr_name": "template_name",
  //         "flowable:string": {
  //             "__cdata": newVal
  //         }
  //     }
  // }


}

function variableChanged(item: any, value: any) {
  const data = node.getData()
  const index = data.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === item.attr_name)
  if (index === -1) {
    data.data.extensionElements['flowable:field'].push({
      'attr_name': item.attr_name,
      'flowable:expression': {
        '__cdata': value ? '${variables:get(' + value + ')}' : ''
      }
    })

  } else {
    data.data.extensionElements['flowable:field'][index] = {
      'attr_name': item.attr_name,
      'flowable:expression': {
        '__cdata': value ? '${variables:get(' + value + ')}' : ''
      }
    }
  }
  console.log('new data', data)
  node.setData({
    ...data,
    version: node.data.version + 1 || 0
  }, {
    overwrite: true,
    deep: true
  })
}


function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    refreshData()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    refreshData()
  })
}

onMounted(async () => {
  searchTemplte()
  setUpListener()
  refreshData()
})

</script>

<template>
  <div class="formContainer">
    <BpmnSidebarEditLabel :node="node" />
    <ElForm label-position="top" label-width="100px" size="small">
      <ElFormItem label="Template Name">
        <ElSelect v-model="template_name" placeholder="Select Template" remote filterable :remote-method="searchTemplte"
                  @change="template_nameChanged">
          <ElOption v-for="item in allTemplate" :key="item.id" :label="item.templateName" :value="item.templateName"
                    :disabled="editorProvider?.readonly.value" />
        </ElSelect>
      </ElFormItem>
      <!-- variable -->
      <template v-if="template_name">
        <ElFormItem v-for="(item, index) in variables" :key="index" :label="item.attr_name">
          <ElSelect v-model="item.cdata" placeholder="Select Variable" filterable clearable
                    @change="(val:any) => variableChanged(item,val)">
            <ElOption v-for="option in allFields" :key="option.attr_id" :label="option.attr_name"
                      :value="option.attr_id" :disabled="editorProvider?.readonly.value" />
          </ElSelect>
        </ElFormItem>
      </template>
    </ElForm>
  </div>
</template>