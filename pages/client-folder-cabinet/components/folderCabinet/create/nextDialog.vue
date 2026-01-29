<template>
  <el-dialog
    style="--scroll-dialog-height: 80vh"
    v-model="state.visible"
    :title="$t('folderCabinet.newItem')"
    :close-on-click-modal="false"
    class="scroll-dialog big"
    append-to-body
  >
    <main>
      <FolderCabinetCreateUploadTree ref="FolderCabinetUploadTreeRef" :treeData="state.treeData"
                                     v-loading="state.treeLoading"></FolderCabinetCreateUploadTree>
    </main>
    <template #footer>
      <el-button id="FolderCabinet__AllowOtherFilesCabinet__NewItem__Next__Submit" type="primary"
                 :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'

const props = defineProps(['id'])
const emits = defineEmits(['refresh'])
const { t } = useI18n()
const userId: string = useUserId().value
const state = reactive<any>({
  loading: false,
  treeLoading: false,
  visible: false,
  cabinetTemplate: {},
  treeData: [],
  rootDetail: {}
})
// #region module: handleSubmit
const FolderCabinetUploadTreeRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const uploadList = await FolderCabinetUploadTreeRef.value.getData(true)
    if (!uploadList) {
      throw new Error('')
    }
    // 后端folder-cabinet有延时，立即上传folder-cabinet不起作用
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await uploadFiles(uploadList, state.rootDetail.idOrPath)
    state.visible = false
    ElMessage.success(t('tip_createdMsg', { modelName: null, name: uploadList[0].previewName }))
    emits('refresh')
  } catch (error) {
    console.log(error)
  } finally {
    state.loading = false
  }

  async function uploadFiles(fileTree: any, parentPath: string) {
    const uploadPromises = fileTree.map((item: any) => {
      if (item.folder) {
        item.parentPath = parentPath
        let defaultValue = {}
        if (item.metadataValue) defaultValue = JSON.parse(item.metadataValue)
        const name =
          item.previewName ||
          getMetaName(
            {
              label: item.label,
              ...defaultValue
            },
            item
          )
        item.name = name
        item.path = parentPath + '/' + item.name
        return createDirectory(item).then((dir: any) => {
          if (dir?.id && item.children) uploadFiles(item.children, item.path)
        })
      } else {
        return uploadFile(item, parentPath)
      }
    })
    await Promise.all(uploadPromises)
  }

  async function createDirectory(directory: any) {
    let defaultValue = {}
    if (directory.metadataValue) defaultValue = JSON.parse(directory.metadataValue)
    const name = directory.previewName
      ? directory.previewName
      : getMetaName(
        {
          label: directory.label,
          ...defaultValue
        },
        directory
      )
    return await clientApi.api.postDmsDocumentFolder({
        templateId: props.id,
        layoutId: directory.id,
        name,
        type: directory.documentType,
        idOrPath: directory.path,
        properties: directory.properties,
        dfcId: state.rootDetail.dfcId
      })
      .then((res) => res.data)
  }

  async function uploadFile(file: any, parentPath: string) {
    let defaultValue = {}
    if (file.metadataValue) defaultValue = JSON.parse(file.metadataValue)
    const name = file.previewName
      ? file.previewName
      : getMetaName(
        {
          label: file.label,
          docName: file.docName,
          ...defaultValue
        },
        file
      )

    const document = {
      templateId: props.id,
      layoutId: file.parentId,
      name,
      idOrPath: parentPath + '/' + name,
      type: file.documentType,
      properties: file.properties,
      dfcId: state.rootDetail.dfcId
    }
    const formData: any = new FormData()
    formData.append('files', file.raw)
    formData.append('document', JSON.stringify(document))
    return await clientApi.api.postDmsDocument(formData).then((res) => res.data)
  }
}

// #endregion

// #region module: init
async function handleOpen(cabinetTemplate: any, doc: any) {
  state.cabinetTemplate = cabinetTemplate
  state.rootDetail.idOrPath = doc.path
  state.rootDetail.id = doc.id
  state.rootDetail.dfcId = doc.dfcId
  state.visible = true
  state.loading = false
  state.treeLoading = true
  try {
    initTreeData(state.cabinetTemplate.children)
    state.treeData = state.cabinetTemplate.children

    setTimeout(() => {
      if (state.treeData[0]) {
        FolderCabinetUploadTreeRef.value.treeRef.setCurrentKey(state.treeData[0].id)
        FolderCabinetUploadTreeRef.value.handleNodeClick(state.treeData[0])
      }
    })
  } catch (error) {
    console.log(error)
  }
  state.treeLoading = false
}

function initTreeData(children: any, parentId: string = '') {
  children.forEach(async (item: any) => {
    item.isLack = false
    if (parentId) item.parentId = parentId
    let defaultValue = {}
    if (item.metadataValue) defaultValue = JSON.parse(item.metadataValue)
    if (item.folder === true) {
      item.properties = {
        ...defaultValue
      }
    }
    item.previewName = getMetaName(
      {
        ...defaultValue,
        docName: item.label,
        label: item.label
      },
      item
    )
    item.docName = item.label

    if (item.children) initTreeData(item.children, item.id)
    else item.children = []
  })
}

function getMetaName(formData: any = {}, row: any) {
  const labelRule = getLabelList(row.labelRule)
  try {
    const data = {
      ...formData,
      ...state.metaFormData,
      label: formData.label,
      docName: formData.docName
    }
    return getNameByLabelRule(labelRule, data)
  } catch (error) {
    console.log(error)
  }
}

// #endregion

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
main {
}
</style>
