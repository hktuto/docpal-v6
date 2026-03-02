<template>
  <el-dialog v-model="state.visible" :title="$t('button.export')"
             :close-on-click-modal="false"
             append-to-body
             class="workflow-download-dialog"
  >
    <div class="search-download-container">
      <div class="search-download-container-box">
        <h3>{{ $t('exportDialog.availableColumns') }}</h3>
        <draggable
          id="first"
          data-source="juju"
          :list="state.exportList"
          class="list-group"
          group="a"
          item-key="id"
        >
          <template #item="{ element }">
            <div class="list-group-item">
              {{ element.name }}
            </div>
          </template>
        </draggable>
      </div>

      <div class="search-download-container-box">
        <h3>{{ $t('exportDialog.disabledColumns') }}</h3>
        <draggable :list="state.hideList" class="list-group" group="a" item-key="name">
          <template #item="{ element }">
            <div class="list-group-item item">
              {{ element.name }}
            </div>
          </template>
        </draggable>
      </div>
    </div>
    <div class="dp-base-tip">
      {{ $t('exportDialog.tip') }}
    </div>
    <template #footer>
      <el-button id="Workflow__Export__Export" type="primary" :disabled="state.exportList.length === 0"
                 :loading="state.loading" @click="handleSubmit()">
        {{ $t('button.export') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import draggable from 'vuedraggable'
// @ts-ignore
const state = reactive<any>({
  loading: false,
  visible: false,
  exportList: [],
  extraParams: {},
  hideList: [],
  activeTab: ''
})

function handleOpen(extraParams: any, workflowType: string) {
  state.visible = true
  state.extraParams = extraParams
  state.activeTab = workflowType
  getExportList()
}

async function handleSubmit() {
  state.loading = true
  try {
    const orderList = state.exportList.reduce((prev: any, item: any) => {
      prev.push(item.id)
      return prev
    }, [])
    let blob: any
    if (state.activeTab === 'completeTask') blob = await newClientApi.postWorkflowHistoryExportprocesshistory({
      ...state.extraParams,
      orderList
    }, {
      format: 'blob',
      headers: {
        'TimeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
    else blob = await newClientApi.postWorkflowTasksExporttasksuser({...state.extraParams, orderList}, {
      format: 'blob',
      headers: {
        'TimeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
    // @ts-ignore
    await downloadBlob(blob, 'workflow.csv')
    state.visible = false
  } catch (error) {
  }
  state.loading = false
}

async function getExportList() {
  let res
  if (state.activeTab === 'completeTask') res = await newClientApi.getWorkflowHistoryGethistoryexportheader().then(res => res.data)
  else res = await newClientApi.postWorkflowTasksGetusersexportheader(state.extraParams).then(res => res.data)
  state.exportList = []
  state.hideList = []
  Object.keys(res).forEach(key => {
    state.exportList.push({id: key, name: res[key]})
  })
}

defineExpose({handleOpen})
</script>
<style lang="scss" scoped>

.search-download-container {
  height: 40vh;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-xs);

  &-box {
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;

    h3 {
      padding: unset;
      margin: 0 0 var(--app-space-xs) 0;
    }

    .list-group {
      overflow: auto;
      padding: var(--app-space-xs);
      border: 1px solid var(--app-grey-800);
      background: var(--app-grey-900);

      .item {
        color: var(--app-grey-400);

        &.sortable-chosen {
          background: var(--app-grey-700);
          color: var(--app-grey-950) !important;
        }
      }
    }

    #first {
      background: var(--app-grey-900);

      .list-group-item {
        font-weight: 500;
        color: var(--app-primary-color);

        &.sortable-chosen {
          background: var(--app-primary-color);
          color: var(--app-grey-950) !important;
        }
      }

    }


  }

  .sortable-chosen {

    padding: calc(var(--app-space-xs) / 4);
  }
}

</style>
<style lang="scss">
.workflow-download-dialog {
  .el-dialog__body {
    padding: 0 20px;
  }
}

.el-dialog__title {
  text-transform: capitalize;
}
</style>
