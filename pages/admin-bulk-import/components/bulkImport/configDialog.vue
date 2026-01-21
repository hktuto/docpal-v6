<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { adminApi,clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const tableColumns = {
  columns: [
    { id: '1', prop: 'title', label: 'title', defaultColumn: true },
    { id: '2', prop: 'name', label: 'tableHeader_name' }
  ],
  events: [],
  options: { pageSize: 20 }
}

const emits = defineEmits([
  'refresh'
])
const { name } = defineProps<{
  name: string,
}>()
const { t } = useI18n()
const FormRef = ref()
const TreeTableFormRef = ref()

const state = reactive({
  pathLoading: false,
  loading: false,
  visible: false,
  isEdit: false,
  profileID: '',
  rules: {
    'title': [
      { validator: handleCheckNameOrTitle, trigger: 'blur' }
    ],
    'name': [
      { validator: handleCheckNameOrTitle, trigger: 'blur' }
    ]
  },
  options: {
    rowKey: 'dpRowId',
    childLen: 1
  },
  tableData: [],
  cascaderProps: {
    checkStrictly: true,
    lazy: true,
    lazyLoad(node: any, resolve: any) {
      const { level, value } = node
      const idOrPath = level == 0 ? '/' : value
      setTimeout(async () => {
        let res = await clientApi.admin.postAdmindmsDocumentChildrenThumbnail({
          idOrPath,
          pageSize: 100000
        }).then(res => res.data) as any
        const nodes = res.entryList.reduce((prev: any, item: any) => {
          if (item.isFolder) prev.push({
            value: item.path,
            label: item.name
          })
          return prev
        }, [])
        // 通过调用resolve将子节点数据返回，通知组件数据加载完成
        resolve(nodes)
      })
    }
  }
})
const formData = reactive<any>({
  profileID: '',
  profileName: '',
  rootPath: []
})

async function handleCheckNameOrTitle(rule: any, value: any, callback: any) {
  if (value === '') {
    callback(new Error(t('render.hint.fieldRequired') as string))
  } else {
    const res = await adminApi.api.postWorkflowChecknameortitle({ nameOrTitle: value })
    if (Number(res.code) === 500) {
      callback(new Error(res.message))
    }
    callback()
  }
}

async function handleSubmit() {
  state.loading = true
  try {
    const configTree = await TreeTableFormRef.value.getFormData()
    const configData = await getFormData()
    if (!configTree || !configData) return false
    const params: any = {
      folder: getFolder(configTree),
      documentType: name,
      profileName: configData.profileName,
      rootPath: configData.rootPath.pop()
    }
    if (state.profileID) params.profileID = state.profileID
    const res = await adminApi.api.postWorkflowSavedocumenttypeprofile(params)
    if (!res.result) {
      ElMessage.error(res.message)
      return
    }
    console.log('res', res)
    state.visible = false
    emits('refresh')
  } catch (error) {

  } finally {
    state.loading = false
  }
}

async function getFormData() {
  const valid = await FormRef.value.validate((valid: any, fields: any) => {
    return valid
  })
  if (!valid) return false
  else return deepCopy(formData)
}

function getFolder(tableData: any) {
  const result = <any>{}
  tableData.forEach((item: any) => {
    result.name = item.name
    result.title = item.title
    if (item.children && item.children.length > 0) {
      result.folder = getFolder(item.children)
    }
  })
  return result
}

function revertFolder(obj: any, folderList: any) {
  const folderItem = {
    name: obj.name,
    title: obj.title,
    children: []
  }
  folderList.push(folderItem)
  if (obj.folder) {
    revertFolder(obj.folder, folderItem.children)
  }
}

async function handleOpen(data: any) {
  state.visible = true
  state.tableData = []
  if (!!data) await revertData(data)
  else {
    formData.profileName = ''
    formData.rootPath = []
  }
  nextTick(() => {
    TreeTableFormRef.value.initTable()
    FormRef.value.clearValidate()
  })
}

async function revertData(profile: any) {
  const folder = JSON.parse(profile.folder)
  revertFolder(folder, state.tableData)

  state.pathLoading = true
  state.profileID = profile.profileID
  formData.profileName = profile.profileName
  try {
    const data: any = await clientApi.admin.postAdmindmsDocumentBreadcrumb(profile.rootPath).then(r => r.data)
    formData.rootPath = data.reduce((prev: any, item: any) => {
      prev.push(item.path)
      return prev
    }, [])
  } catch (error) {
    formData.rootPath = [profile.rootPath]
  }
  state.pathLoading = false
}

defineExpose({ handleOpen })
</script>

<template>
  <el-dialog v-model="state.visible"
             :title="state.isEdit ? $t('docType_editCaptureProfile') : $t('docType_addCaptureProfile')"
             :close-on-click-modal="false"
  >
    <el-form v-loading="state.pathLoading" :model="formData" ref="FormRef" label-position="top" @submit.native.prevent>
      <el-form-item :label="$t('docType_profileName')"
                    prop="profileName"
                    :rules="[{ required: true, message: $t('docType_profileName') + $t('render.hint.fieldRequired')}]"
      >
        <el-input type="text" v-model="formData.profileName" />
      </el-form-item>
      <el-form-item :label="$t('dpTable_rootPath')"
                    prop="rootPath"
                    :rules="[{ required: true, message: $t('dpTable_rootPath') + $t('render.hint.fieldRequired')}]"
      >
        <el-cascader v-model="formData.rootPath" :props="state.cascaderProps" filterable clearable></el-cascader>
      </el-form-item>
    </el-form>
    <TreeTableForm ref="TreeTableFormRef" :columns="tableColumns.columns" :table-data="state.tableData"
                   :treeTableFormRule="state.rules"
                   :options="state.options"></TreeTableForm>
    <template #footer>
      <el-button id="BulkImport__Profile__AddNewCaptureProfile__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit()">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
:deep(.el-cascader) {
  width: 100%
}
</style>
