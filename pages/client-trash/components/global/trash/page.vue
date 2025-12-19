<template>
  <div class="pageContainer--padding">
    <VxeGrid v-loading="state.loading" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <header v-show="state.selectList.length === 0" class="header-flex">
          <div class="flex-x-start">
            <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" />
            <el-button id="Trash__EmptyTrash" type="danger" @click="handleDeleteAll">
              {{ t('trash_emptyTrash') }}
            </el-button>
          </div>
        </header>
        <header v-show="state.selectList?.length > 0" class="header-flex">
          <div class="flex-x-start">
            <el-button id="Trash__RestoreSelected" type="primary" @click="handleBathRestore(true, state.selectList)">
              {{ t('trash_actions_restore') }}
            </el-button>
            <el-button id="Trash__PermanentlyDeleteSelected" type="danger" @click="handleBathDelete(true, state.selectList)">
              {{ t('trash_actions_delete') }}
            </el-button>
          </div>
        </header>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox, ElNotification } from 'element-plus'
import { clientApi } from 'api'
import {useDebounceFn} from '@vueuse/core'

const routerProvider = inject(MenuRouterKey)
type TableState = {
  ready: boolean
  loading: boolean
  extraParams: any
  extraParamsFilter: any
  selectList: any[]
}
const state = reactive<TableState>({
  ready: false,
  loading: false,
  extraParams: {},
  extraParamsFilter: {},
  selectList: []
})

const { t } = useI18n()
const ResponsiveFilterRef = ref()





function handleFilterFormChange(formModel: any) {
  state.extraParamsFilter = formModel
  debouncedReload()
}

function dblClickHandler(row: any) {
  const params = createDetailPageParams({
      idOrPath: row.id,
      docName: row.name
    })
    routerProvider?.navigateTo(params, true)
}

const { tableConfig, tableEvent, tableRef, reload, query, cleanSelectedRows } = useVxeTable({
  id: 'clientTrashList',
  api: async (pageParams: any) => {
    cleanSelectedRows()
    pageParams = { ...pageParams, ...state.extraParamsFilter }
    return clientApi.api.postNuxeoDocumentTrash(pageParams)
  },
  columns: [
    { field: 'checkbox', type: 'checkbox', width: '50px', fixed: 'left' },
    {
      field: 'name',
      title: 'document_name',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        if (row.isFolder) {
          icon = '/icons/doc/folder.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" /> ${cellValue}</span>`
        }
        if (!row.fileContentMimeType) {
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} </span> `
        }
        const mimeType = row.fileContentMimeType
        if (mimeType?.startsWith('image')) {
          icon = '/icons/doc/image.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('video')) {
          icon = '/icons/doc/video.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('audio')) {
          icon = '/icons/doc/audio.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('application/pdf')) {
          icon = '/icons/doc/pdf.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('text')) {
          icon = '/icons/doc/text.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('application/zip')) {
          icon = '/icons/doc/zip.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('application/vnd.ms-excel') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          icon = '/icons/doc/excel.svg'
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        if (mimeType?.startsWith('application/msword') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          icon = `/icons/doc/word.svg`
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        // if mimetype is ppt, return ppt src
        if (
          mimeType?.startsWith('application/vnd.ms-powerpoint') ||
          mimeType?.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')
        ) {
          icon = `/icons/doc/ppt.svg`
          return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
        }
        return `<span class="tableRow-icon-cell"><img src="${icon}" class="browseFileIcon" /> ${cellValue}</span> `
      }
    },
    { field: 'path', title: 'document_path' },
    { field: '`documentType`', title: 'tableHeader_type' },
    { field: 'modifiedBy', title: 'modified_by' },
    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'restore_file',
        name: 'trash_restored',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleBathRestore(false, [row])
        }
      },
      {
        code: 'delete_file',
        name: 'trash_delete',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleBathDelete(false, [row])
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }) => {
    dblClickHandler(row)
  },
  permissionMethod: ({ options, column, row, rowIndex }: any) => {
    if (!row) {
      return {
        disabled: true,
        visible: false
      }
    }
    if (state.loading) {
      return {
        visible: false,
        disabled: true
      }
    }

    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectList = [...selectedRows]
  },
  optionalConfig: {
    checkboxConfig: {
      checkMethod: ({ row }) => {
        return row.permissionIds.includes(12)
      }
    },
  }
})

const debouncedReload = useDebounceFn(reload, 300)

async function handleDeleteAll() {
  try {
    const action = await ElMessageBox.confirm(t('trash_emptyTrashMsg'), {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return

    state.loading = true
    await clientApi.api.deleteNuxeoDocumentPurge()
    setTimeout(async () => {
      state.loading = false
      routerProvider?.message.success(t('trash_emptyTrashSuccessMsg'))
      reload()
    }, 2000)
  } catch (error) {
    console.log(error)
  }
}

async function handleBathRestore(status: boolean, selectList: any) {
  state.loading = true
  let promises = []

  for (const row of selectList) {
    promises.push(restore(row.id, row.name))
  }
  const allResponse = await Promise.all(promises)

  const failMessage = allResponse.reduce((result, item) => {
    if (item) result += item
    return result
  }, '')
  if (failMessage.length > 0) {
    state.loading = false
    handleMsg(failMessage)
    return
  }

  setTimeout(async () => {
    state.loading = false
    routerProvider?.message.success(selectList.length > 1 ? t('trash_restoredSelectedSuccessMsg') : t('trash_restoredSuccessMsg'))
    query()
  }, 1000)
  if (status) {
    state.selectList = []
  }
}

async function handleBathDelete(status: boolean, selectList: any) {
  try {
    const action = await ElMessageBox.confirm(selectList.length > 1 ? t('trash_deleteSelectedMsg') : t('trash_deleteMsg'), {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return

    state.loading = true
    let promises = []

    for (const row of selectList) {
      promises.push(deleteOne(row.id, row.name))
    }
    const allResponse = await Promise.all(promises)

    const failMessage = allResponse.reduce((result, item) => {
      if (item) result += item
      return result
    }, '')
    if (failMessage.length > 0) {
      state.loading = false
      handleMsg(failMessage)
      return
    }

    setTimeout(async () => {
      state.loading = false
      routerProvider?.message.success(selectList.length > 1 ? t('trash_deleteSelectedSuccessMsg') : t('trash_deleteSuccessMsg'))
      query()
    }, 1000)
    if (status) {
      state.selectList = []
    }
  } catch (error) {
    console.log(error)
  }
}

function handleMsg(messages: string) {
  const count = messages.trim().split('</br>')
  console.log('msg', messages)
  console.log('count', count)
  if (count.length === 1) return
  ElNotification.error({
    title: `${t('commons_error')}: ${count.length - 1} ${t('trash_fileOrFolder')}`,
    dangerouslyUseHTMLString: true,
    message: messages
  })
}

async function deleteOne(idOrPath: string) {
  try {
    await clientApi.api.deleteNuxeoDocument({ idOrPath }, { headers: { noErrorMessage: true } })
  } catch (error) {
    console.log(error)
    return `${t('doc_typeSmartFolderSearchName')}: ${name}, ${t('upload_Status_error')}: ` + (error?.response?.data?.message || 'Server Error') + '.</br> '
  }
}

async function restore(idOrPath: string, name: string) {
  try {
    await clientApi.api.postNuxeoDocumentRestore({ idOrPath }, { headers: { noErrorMessage: true } })
    return null
  } catch (error) {
    console.log('call Api error', error)
    return `Fiel / Folder Name: ${name}` + ', Error: ' + (error?.response?.data?.message || 'Server Error') + '.</br> '
  }
}

onMounted(() => {
  state.selectList = []
})
</script>

<style lang="scss" scoped></style>
