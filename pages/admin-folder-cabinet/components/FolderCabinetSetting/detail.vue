<template>
  <div class="detail-container" v-loading="state.loading" :class="{ 'not-root': !isRoot }">
    <div style="overflow: auto; padding: 0 var(--app-space-xs)">
      <div class="flex-x-start">
        <BrowseItemIcon class="file-icon el-icon--left" :type="state.setting.folder ? 'folder' : 'file'" :fileName="state.setting.label" />
        {{ state.setting.label }}
      </div>
      <FormRenderer ref="FormRendererRef" :form-json="formJson" @formChange="formChange"></FormRenderer>
      <div style="padding: 0 var(--app-space-xs)">
        <el-divider v-if="isRoot" />
        <el-form label-position="top" ref="FormRef" :model="form">
          <el-form-item prop="labelRule" class="intro" :rules="[{ required: true, message: $t('tableHeader_labelRule') + $t('render.hint.fieldRequired') }]">
            <template #label>
              {{ $t('tableHeader_labelRule') }}
              <!-- <span
                v-if="state.curDocType"
                class="color__primary__hover cursorPointer"
                @click="goMetaEdit"
                >({{ $t("tip.clickToEditDisplayMeta") }})</span
              > -->
            </template>
            <DragSelect
              :dragList="state.dragList"
              :dropList="form.labelRule"
              itemKey="metadata"
              nullTip="tip.pleaseGoToConfigDisplayMetaOrSelectDocumentType"
            />
          </el-form-item>
        </el-form>
        <el-divider />
        <h3>{{ $t('folderCabinet.defaultMetadataValue') }}</h3>
        <MetaRenderForm2 ref="MetaFormRef" />
        <el-divider />
        <template v-if="state.setting.folder">
          <h3>{{ $t('folderCabinet.allowFilesTip') }}</h3>
          <el-switch v-model="form.allow" class="mb-2" active-text="Yes" inactive-text="No" />
        </template>
        <template v-else>
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="grid-content ep-bg-purple" />
              <h3>{{ $t('folderCabinet.multiple') }}</h3>
              <el-switch v-model="form.multiple" class="mb-2" active-text="Yes" inactive-text="No" />
            </el-col>
            <el-col :span="12">
              <div class="grid-content ep-bg-purple" />
              <h3>{{ $t('folderCabinet.repeatName') }}</h3>
              <el-switch v-model="form.repeatName" class="mb-2" active-text="Yes" inactive-text="No" />
              <div>{{ $t('folderCabinet.repeatNameTip') }}</div>
            </el-col>
          </el-row>
        </template>

        <el-divider />
        <FolderCabinetSettingPermission
          :id="state.setting.id"
          :isFolder="state.setting.folder ? 'folder' : 'file'"
          :tableData="state.acls"
          @refresh="emits('update')"
        />
      </div>
    </div>
    <div style="padding: var(--app-space-xs); text-align: right">
      <el-button id="FolderCabinetSetting__Info__Delete" type="info" @click="handleDelete">
        {{ $t('common_delete') }}
      </el-button>
      <el-button id="FolderCabinetSetting__Info__Save" type="primary" @click="handleSave">
        {{ $t('button.save') }}
      </el-button>
    </div>
    <FolderCabinetSettingWorkflowDialog ref="WorkflowDialogRef" :id="state.setting.id" />
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
import { ElMessageBox } from 'element-plus'
import formJson from './detail.vform.json'
import { routeFolderCabinetPage } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const props = defineProps(['data', 'isRoot', 'id', 'tree'])
const emits = defineEmits(['update'])
// @ts-ignore
const ignoreList = getIgnoreSchemas()
const { t } = useI18n()
const FormRendererRef = ref()
const state = reactive<any>({
  loading: false,
  setting: {
    id: ''
  },
  curDocType: '',
  dragList: [],
  defaultValue: {},
  acls: []
})
// #region module:
const form = reactive({
  labelRule: [{ metadata: 'fc:docTitle', dataType: 'string', noDelete: false }],
  allow: false,
  multiple: false,
  repeatName: false
})
const FormRef = ref()
const MetaFormRef = ref()

function formChange({ fieldName, newValue, oldValue, formModel }) {
  // console.log(fieldName, newValue, oldValue, formModel)

  if (fieldName === 'documentType') handleDocTypeChange(newValue)
}

async function handleDocTypeChange(docType: string) {
  const metaList = await MetaFormRef.value.init(docType)
  state.curDocType = docType
  state.dragList = metaList.reduce((prev: any, item: any) => {
    if (['boolean'].includes(item.options.validationType)) return prev
    if (item.options.validationType === 'array') {
      if (item.options.multiple || item.options.type === 'daterange') return prev
    }
    prev.push({
      name: item.label,
      metadata: item.name,
      dataType: item.options.validationType
    })
    return prev
  }, [])
  state.dragList.push(
    { name: 'fc:label', metadata: 'fc:label', dataType: 'string' },
    { name: 'fc.createDate', metadata: 'fc:createDate', dataType: 'date' },
    { name: 'fc:creator', metadata: 'fc:creator', dataType: 'string' },
    { name: 'fc:docTitle', metadata: 'fc:docTitle', dataType: 'string' }
  )
  if (form.labelRule.length > 0) {
    state.dragList = state.dragList.filter(
      (allItem: any) => !form.labelRule.some((exitItem: any) => exitItem.metadata === allItem.metadata || exitItem.metaData === allItem.metadata)
    )
  }
  setTimeout(() => {
    MetaFormRef.value.setData(state.defaultValue)
  }, 1000)
}

function getReminder(data: any, revertList: any) {
  return revertList.reduce((prev: any, item: any) => {
    if (data[item]?.intervalTime) prev[`${item}.intervalTime`] = data[item].intervalTime
    if (data[item]?.tos) prev[`${item}.tos`] = data[item].tos
    if (data[item]?.ccs) prev[`${item}.ccs`] = data[item].ccs
    return prev
  }, {})
}

const showNotification = ref(props.isRoot)

// #endregion
function init(row: any) {
  if (!row) return
  state.setting = row
  state.loading = true
  setTimeout(() => {
    state.acls = []
    const _row = {
      metadata: []
    }
    form.allow = row.allow
    form.multiple = row.multiple || false
    form.repeatName = row.repeatName || false
    if (row.labelRule) {
      const labelRule = JSON.parse(row.labelRule)
      labelRule.forEach((item: any) => {
        if (item.metaData) {
          item.metadata = item.metaData
          if (item.metadata === 'fc:docTitle') {
            item.noDelete = false
          }
        }
      })
      form.labelRule = labelRule
    } else {
      form.labelRule = []
    }
    if (row.metadata) {
      _row.metadata = row.metadata.map((item: any) => item.name)
    }
    if (row.acls) state.acls = row.acls
    if (row.metadataValue) state.defaultValue = JSON.parse(row.metadataValue)
    else state.defaultValue = {}

    const reminder = getReminder(row, ['notificationReminder', 'emailReminder', 'emailReport'])
    console.log('reminder', reminder)
    FormRendererRef.value.vFormRenderRef.setFormData({
      ...row,
      ..._row,
      ...getReminder(row, ['notificationReminder', 'emailReminder', 'emailReport']),
      showNotification: props.isRoot,
      useNotification: reminder?.['notificationReminder.tos']?.length > 1
    })
    state.loading = false
  })
}

const WorkflowDialogRef = ref()

async function handleSave() {
  try {
    try {
      await FormRef.value.validate()
    } catch (e) {
      console.error(e)
      return
    }
    const data = await FormRendererRef.value.getFormData()
    if (!data) return

    if (props.isRoot) {
      if (state.setting.label != data.label) {
        const { data: checkName } = await newAdminApi.postDmsCabinetTemplateDuplicateName({ label: data.label })
        if (checkName) {
          routerProvider?.message.error(t('common_nameExists'))
          return
        }
      }
    } else {
      if (checkDuplicateLabel(state.setting.parentId, state.setting.id, data.label, props.tree.children)) {
        routerProvider?.message.error(t('common_nameExists'))
        return
      }
    }
    const params = {
      ...data,
      allow: form.allow,
      multiple: form.multiple,
      repeatName: form.repeatName,
      labelRule: JSON.stringify(form.labelRule),
      id: state.setting.id,
      // folder: true
      folder: state.setting.folder
    }

    if (props.isRoot) {
      const arr = ['notificationReminder', 'emailReminder', 'emailReport']
      arr.forEach((key) => {
        params[key] = {}
        params[key].intervalTime = params[`${key}.intervalTime`]

        if (params[`${key}.tos`]) params[key].tos = data.useNotification ? params[`${key}.tos`] : ['createBy']
        if (params[`${key}.ccs`]) params[key].ccs = params[`${key}.ccs`]
        delete params[`${key}.intervalTime`]
        delete params[`${key}.tos`]
        delete params[`${key}.ccs`]
      })
    }
    if (params.metadata && params.metadata.length > 0) {
      const metaRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('metadata')
      const options = metaRef.getOptionItems()
      params.metadata = params.metadata.reduce((prev: any, key: string) => {
        const item = options.find((t: any) => t.value === key)
        if (!!item) {
          prev.push({
            type: item.dataType,
            name: key
          })
        }
        return prev
      }, [])
    }
    const metadataDefault = await MetaFormRef.value.getData(false)
    if (!metadataDefault) return
    if (metadataDefault) params.metadataValue = JSON.stringify(metadataDefault)

    state.loading = true
    await newAdminApi.patchDmsCabinetTemplate(params)
    routerProvider?.message.success(t('tip_updateMsg', { modelName: t('folder_folderCabinetDetails'), name: null }))
    emits('update')
    WorkflowDialogRef.value.handleCheck()
  } catch (error) {
    console.log('call err', error)
  } finally {
    setTimeout(() => (state.loading = false), 300)
  }
}

const checkDuplicateLabel = (parentId: string, id: string, name: string, data: any) => {
  let hasDuplicate = false

  const checkItems = (items: any) => {
    // Check if items exist
    if (!items || items.length === 0) return

    for (const item of items) {
      // Check whether the current project meets the criteria
      if (item.parentId === parentId && item.id !== id && item.label === name) {
        hasDuplicate = true
        break
      }
      // If children exist
      if (item.children && item.children.length > 0) {
        checkItems(item.children)
      }
    }
  }

  checkItems(data)
  return hasDuplicate
}

async function handleDelete() {
  try {
    const msg = state.setting.folder ? t('folder_entireFolderCabinet') : t('common_file')
    const action = await ElMessageBox.confirm(
      t('tip_deleteMsg', {
        modelName: msg,
        name: null
      }),
      {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      }
    )
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsCabinetId(state.setting.id)
    if (props.isRoot) {
      routerProvider?.navigateTo(routeFolderCabinetPage(), false)
      routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: msg }))
    } else {
      emits('update')
    }
  } catch (error) {
    console.log(error)
  }
}

// function goMetaEdit () {
//   let r = '/documentType'
//   if (state.curDocType) r += `/${state.curDocType}`
//   const url = router.resolve(r)
//   window.open(url.href, '_blank');
// }
defineExpose({ init })
</script>
<style lang="scss" scoped>
.detail-container {
  display: grid;
  grid-template-rows: 1fr min-content;
  overflow: hidden;
}

.formContainer {
  min-height: unset;
}

:deep(.el-form-item__content) {
  width: 100%;

  & > div {
    width: 100%;
  }
}
</style>
<style lang="scss">
.not-root .notification-container {
  display: none;
}
</style>
