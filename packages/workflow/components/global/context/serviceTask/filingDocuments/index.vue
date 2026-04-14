<script setup lang="ts">
import { newAdminApi, newClientApi } from 'api'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const emits = defineEmits(['update'])
const { config } = defineProps<{
  config: {
    body: {
      folderCabinetId: string
      folderCabinet: []
    }
  }
}>()
const formData = ref<{
  body: {
    folderCabinetId: string
    folderCabinet: []
  }
}>({
  body: {}
})
const form = ref()
const cabinetOptions = ref([])
const cabinetDetail = ref()
const loading = ref(false)
const elementsIdList = ref()

async function initForm() {
  cabinetOptions.value = (await newAdminApi.getDmsCabinetList().then((res) => res.data)) || []
  formData.value = config

  // 已使用的節點
  elementsIdList.value = formData.value.body.folderCabinet.map((item) => item.id)
  await getCabinetDetail()
}

function updateData() {
  emits('update', {
    name: 'update-upload-file-data',
    config: formData.value
  })
}

async function getCabinetDetail() {
  if (!formData.value.body.folderCabinetId || formData.value.body.folderCabinetId === '') {
    return
  }

  loading.value = true
  try {
    const data = await newAdminApi.getDmsCabinetTemplateId(formData.value.body.folderCabinetId).then((res) => res.data)
    if (!data) return

    cabinetDetail.value = data
  } catch (e) {
    console.log(e)
    loading.value = false
    // 需要置空list
    return
  }

  let arr: any[] = []
  arr = await loopChildren(arr, cabinetDetail.value, 0)

  form.value = arr.map((item) => {
    let field: any[]

    const record = {
      id: item.id,
      parentId: item.parentId,
      documentId: '',
      name: item.label,
      level: item.level,
      isFolder: item.folder,
      mapping: [],
      check: elementsIdList.value?.includes(item.id)
    }

    if (formData.value.body.folderCabinet.length > 0) {
      const fc: any = formData.value.body.folderCabinet.find((fItem: any) => fItem.id === item.id)
      if (!fc) return record

      field = item.displayMeta.reduce((allMeta: any, meta: any) => {
        if (!!fc && !!fc.mapping) {
          allMeta.push({
            formProperty: fc.mapping[meta.key] || '',
            metadata: meta.key,
            metaDataType: meta.type
          })
        } else {
          allMeta.push({
            formProperty: '',
            metadata: meta.key,
            metaDataType: meta.type
          })
        }
        return allMeta
      }, [])

      record.documentId = fc.documentId || ''
    } else {
      field = item.displayMeta.map((meta: any) => ({
        formProperty: '',
        metadata: meta.key,
        metaDataType: meta.type
      }))
    }

    record.mapping = field
    return record
  })
  loading.value = false
}

async function loopChildren(all: any, item: any, level = 0) {
  const data: any = await newClientApi
    .getDmsDocpalTypeDocpaltypenameSchema(item.documentType, {
      headers: { noThrowError: 'true' }
    })
    .then((r) => r.data)
  const displayMata = [
    {
      key: 'fc:docTitle',
      maxLength: 255,
      type: 'string',
      validationName: 'text'
    }
  ]

  let propertiesArray: any = []
  if (data && data.properties) {
    propertiesArray = Object.entries(data.properties).length > 0 ? Object.entries(data.properties).map(([key, value]) => ({ key, ...value })) : []
  }

  all.push({
    ...item,
    level,
    displayMeta: [...displayMata, ...propertiesArray]
  })

  if (item.children) {
    level++
    for (const child of item.children) {
      all = await loopChildren(all, child, level)
    }
  }
  return all
}

function handleUpdateField(list: any) {
  formData.value.body.folderCabinet = list
  updateData()
}

function handleUpdateFieldData(item: any) {
  console.log(123, item)
  const list = formData.value.body.folderCabinet

  const idx = list.findIndex((f: any) => f.id === item.id)
  if (idx === -1) {
    return
  }
  const next = [...list]
  next[idx] = item
  formData.value.body.folderCabinet = next
  // updateData()
}

watch(
  () => config,
  () => {
    initForm()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-form label-position="top" @native.enter="() => {}">
    <el-form-item label="Folder Cabinet">
      <el-select v-model="formData.body.folderCabinetId" :disabled="graphProvider.readonly.value" @change="getCabinetDetail" clearable>
        <el-option v-for="item in cabinetOptions" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>

  <div class="folderCabinetDetail" v-if="formData.body.folderCabinetId">
    <ContextServiceTaskFilingDocumentsDetail
      v-loading="loading"
      v-model:field="form"
      :folderCabinetItem="cabinetDetail"
      @update:fields="handleUpdateField"
      @update:fieldData="handleUpdateFieldData"
    />
  </div>
</template>

<style scoped lang="scss">
.folderCabinetContainer {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: calc(var(--app-space-xs) / 2);
  overflow: hidden;

  .folderCabinetDetail {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
