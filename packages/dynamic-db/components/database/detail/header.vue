<script lang="ts" setup>
import { InfoFilled, Document } from '@element-plus/icons-vue'
const { databaseMenuRouteParams, database, menuState, findItemById } = useSingleDatabaseContext()


defineSlots<{
  default?: (props: {}) => any
  left?: (props: {}) => any
  right?: (props: {}) => any
}>()

type InfoDialogItem = {
  id: string
  descriptioin: string
}

const infoDialogVisible = ref(false)
const infoDialogItem = ref<InfoDialogItem>({
  id: '',
  descriptioin: ''
})

const pageTitle = computed(() => {
  const params = databaseMenuRouteParams.value
  if (params.detailType === 'root') {
    return database.value?.name || ''
  }
  const targetId = params.detailType === 'record' ? params.tableId : params.detailId
  const item = findItemById(menuState.value.items, targetId)
  return item?.name || targetId || ''
})

function handleInfoClick() {
  infoDialogItem.value = {
    id: databaseMenuRouteParams.value.detailId ?? '',
    descriptioin: databaseMenuRouteParams.value.description ?? ''
  }
  infoDialogVisible.value = true
}

function handleInfoInput(description: string) {
  const params = databaseMenuRouteParams.value
  if (params.detailId !== infoDialogItem.value.id) return
  params.description = description
  const menuItem = findItemById(menuState.value.items, params.detailId)
  if (menuItem) {
    menuItem.description = description
  }
}
</script>

<template>
  <div class="headerContainer">
    <div class="headerLeft">
      <div class="header-left-slot">
        <slot name="left" />
      </div>
      <span class="breadcrumb-current">
        <el-icon class="record-icon"><Document /></el-icon>
        {{ pageTitle }}
      </span>
      <el-tooltip :content="databaseMenuRouteParams.description" placement="bottom">
        <el-icon
          v-if="databaseMenuRouteParams.detailType === 'master_table'"
          class="el-icon--right cursor-pointer"
          @click="handleInfoClick"
        >
          <InfoFilled />
        </el-icon>
      </el-tooltip>
      <div id="dashboard_detail_header"></div>
    </div>

    <div class="headerRight">
      <slot name="right" />
      <slot />
    </div>
  </div>
  <DatabaseDetailInfoPopover v-model="infoDialogVisible" :item="infoDialogItem" @input="handleInfoInput" />
</template>

<style lang="scss" scoped>
.headerContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--app-space-m);
  height: var(--app-header-height);
  border-bottom: 1px solid var(--app-grey-900);
  background: var(--app-grey-950);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left-slot {
  display: flex;
  align-items: center;
}

.breadcrumb-current {
  color: var(--el-text-color-primary);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.record-icon {
  font-size: 14px;
}
</style>
