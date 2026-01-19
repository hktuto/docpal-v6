<script setup lang="ts">
import { clientApi } from 'api'

const props = defineProps<{
  documentTemplateList: any[]
}>()

function handleEditDocumentTemplate(item: any) {
  console.log('item', item)
}

type documentTemplateItem = {
  oldId: string,
  newId: string
}

const documentList = ref<documentTemplateItem[]>([])

async function handleCreateDocumentTemplate() {
  const list: any[] = []

  for (const item of Object.values(props.documentTemplateList)) {
    try {
      const fileName = item.name + '.json'
      const jsonData = JSON.stringify(item.fileBlob)

      const blob = new Blob([jsonData], { type: 'application/json; charset=utf-8' })
      const file = new File([blob], fileName, { type: 'application/json' })

      const data: any = await clientApi.admin.postAdmindmsTemplateDocument({}, {
        name: item.name,
        file: file,
        fileType: item.fileType,
        description: item.description
      }).then(r => r.data)

      if (!data.id) {
        list.push(item.name)
        continue
      }

      await clientApi.admin.patchAdmindmsTemplateDocumentUpdatetemplatevariable({
        id: data.id,
        templateVariable: JSON.stringify(item.fileBlob.variablesSchema)
      }).then(r => r.data)

      documentList.value.push({
        oldId: item.id,
        newId: data.id
      })
    } catch (e) {
      list.push(item.name)
      throw new Error(list.join(', '))
    }
  }
  return documentList.value
}

async function createFile(fileType: 'Word' | 'Excel' | 'PPT' | 'PDF', name: string) {
  if (fileType === 'Word') {
    fileType = 'Json'
  }

  const path = `/docTemplate/template${ExtensionMap[fileType]}`
  const file = await fetch(path)
  const fileArrayBuffer = await file.arrayBuffer()
  return new File([fileArrayBuffer], `${name}${ExtensionMap[fileType]}`, { type: ExtensionMimeTypeMap[fileType] })
}

defineExpose({
  handleCreateDocumentTemplate
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.documentTemplateList" :key="item.key">
      <el-col :span="4">
        <el-card style="max-height: 100px;">
          <div class="card-header" @dblclick="handleEditDocumentTemplate(item)">
            <h4>{{ item.name }}</h4>
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}
</style>
