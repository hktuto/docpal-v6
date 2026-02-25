<script lang="ts" setup>
const state = reactive<any>({
  activeTab: 'allTask',
  loading: false
})

function tabChange(tab: string) {
  // const refreshList = ["allTask", "myTask", "activeTask"];
  // if (refreshList.includes(tab)) {
  //   const time = new Date().valueOf().toString();
  //   // router.push({ query: { tab, time } });
  // } else {
  //   // router.push({ query: { tab } });
  // }
}

const WorkflowRef = ref()
const WorkflowPopoverDownloadRef = ref()

async function handleDownload() {
  const params = WorkflowRef.value.getDownloadParams()
  console.log(params)
  WorkflowPopoverDownloadRef.value.handleOpen(params, state.activeTab)
}
</script>
<template>
  <div class="pageContainer--padding workflow-page">
    <div class="buttons--absolute">
      <!-- TODO: Lyle反饋該功能已棄用    -->
      <!--      <el-button
              id="Workflow__Export"
              v-show="state.activeTab !== 'adhocTask'"
              class="el-icon&#45;&#45;left"
              type="info"
              @click="handleDownload"
            >
              {{ $t("button.export") }}
            </el-button>-->
      <WorkflowPopoverPersonal />
      <WorkflowPopoverNewTask @created="tabChange(state.activeTab)" />
    </div>
    <el-tabs
      v-model="state.activeTab"
      class="tag-container dp-tabs--auto"
      @tab-change="tabChange"
    >
      <el-tab-pane :label="$t('workflow_allTask')" name="allTask">
        <WorkflowAllTask v-if="state.activeTab === 'allTask'" ref="WorkflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_myTask')" name="myTask">
        <WorkflowMyTask v-if="state.activeTab === 'myTask'" ref="WorkflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_completedTask')" name="completeTask">
        <WorkflowCompleteTask
          v-if="state.activeTab === 'completeTask'"
          ref="WorkflowRef"
        />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_activeTask')" name="activeTask">
        <WorkflowActiveTask v-if="state.activeTab === 'activeTask'" ref="WorkflowRef" />
      </el-tab-pane>
      <el-tab-pane :label="$t('workflow_adhocTask')" name="adhocTask">
        <WorkflowAdhocTask v-if="state.activeTab === 'adhocTask'" ref="WorkflowRef" />
      </el-tab-pane>
      <!-- <el-tab-pane
        v-if="checkLicenseFeatures('WORKFLOW_ADHOC')"
        :label="$t('workflow_adhocTask')"
        name="adhocTask"
      >
        <WorkflowAdhocTask v-if="state.activeTab === 'adhocTask'" ref="WorkflowRef" />
      </el-tab-pane> -->
    </el-tabs>

    <WorkflowPopoverDownload ref="WorkflowPopoverDownloadRef" />
  </div>
</template>
<style lang="scss" scoped>
.pageContainer--padding.workflow-page {
  display: grid;
  grid-template-rows: 1fr min-content;
  gap: var(--app-space-xs);
  @container (max-width: 1200px) {
    grid-template-rows: min-content 1fr min-content;
  }
  .el-tab-pane {
    height: 100%;

    div {
      height: 100%;
    }
  }
}

.buttons--absolute {
  position: absolute;
  right: calc(var(--app-space-xs) * 2);
  top: calc(var(--app-space-xs) * 2);
  z-index: 2;
  @container (max-width: 1200px) {
    position: relative;
    right: auto;
    top: auto;
  }
}

.dp-tabs--auto {
  width: 100%;
  overflow: hidden;
}
</style>
