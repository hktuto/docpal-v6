<template>
  <div class="pageContainer--padding">
    <el-tabs v-model="state.activeTab" class="tag-container dp-tabs--auto" @tab-change="tabChange">
      <el-tab-pane
        v-for="item in state.tabList"
        :key="item.id"
        :name="item.id"
        v-loading="state.loading"
      >
        <template #label>
          <div class="tab-label" :title="item.label">{{ item.label }}</div>
        </template>
      </el-tab-pane>
    </el-tabs>
    <main>
      <FolderCabinetTable ref="tableRef" :id="state.activeTab" :detail="state.activeFCSetting"
                          @row-click="handleRowClick">
        <!-- <template #suffixSortButton>
          <el-button data-testid="folderCabinet-new-button" @click="handleNewItem()">{{
            $t("folderCabinet.newItem")
          }}</el-button> -->
        <!-- <el-button class="suffixSortButton" @click="handleNextItem()">{{$t('handleNextItem.newItem')}}</el-button> -->
        <!-- <el-button
          type="info"
          data-testid="folderCabinet-export-button"
          @click="handleDownload()"
          >{{ $t("export") }}</el-button
        >
        <el-button v-if="state.uploading" :loading="state.uploading" text></el-button>
      </template> -->
      </FolderCabinetTable>
      <InteractDrawer ref="InteractDrawerRef" :minWidth="240">
        <FolderCabinetMatchingResult ref="MatchingResultRef" :folderCabinet="state.curFolderCabinet" />
        <!-- <template #drawerAction> -->
        <!-- <el-button text> -->
        <!-- {{ formatDate(state.curFolderCabinet.modifiedDate, 'YYYY-MM-DD hh:mm:ss') }} -->
        <!-- </el-button> -->
        <!-- </template> -->
      </InteractDrawer>
    </main>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessageBox } from 'element-plus'

const state = reactive<any>({
  loading: false,
  activeTab: '',
  activeFCSetting: {},
  tabList: [],
  uploadList: [],
  uploading: false,
  curFolderCabinet: {}
})
const tableRef = ref()

function tabChange(tab: string) {
  state.activeTab = tab
  state.activeFCSetting = state.tabList.find((item: any) => item.id === state.activeTab)
  setTimeout(() => {
    tableRef?.value.reload()
  }, 100)
  // router.push({ query: { tab, time } });
}

// #region module: init
async function init() {
  state.loading = true
  try {
    state.tabList = await clientApi.api.getDmsCabinetLoginuserList().then((res) => res.data)
  } catch (error) {
  }
  state.loading = false
}

// #endregion
const MatchingResultRef = ref<any>(null)
const InteractDrawerRef = ref<any>(null)

function handleRowClick(row: any) {
  state.curFolderCabinet = row
  MatchingResultRef.value.init(row, state.activeTab)
  InteractDrawerRef.value.handleOpen()
}

onMounted(async () => {
  await init()
  if (!state.activeTab && state.tabList.length > 0) {
    tabChange(state.tabList[0].id)
  }
})
</script>
<style lang="scss" scoped>

.dp-tabs--auto {
  height: 100%;
  overflow: hidden;

  .el-tab-pane {
    height: 100%;
  }
}

.pageContainer--padding {
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
}

main {
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: var(--app-space-xs);
}
</style>
