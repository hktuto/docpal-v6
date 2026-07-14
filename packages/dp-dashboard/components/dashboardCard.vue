<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
const emits = defineEmits(['delete', 'refreshSetting', 'openSetting', 'refresh', 'resize'])
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    showSkeleton?: boolean
    hideSetting?: boolean
    title?: string
    subtitle?: string
    footer?: string
    additionalStyle?: Record<string, any>
    settingRef?: any
    setting?: any
    mode?: 'mock' | 'real'
    showRefreshIcon?: boolean
    showFullscreenIcon?: boolean
    extraParams?: any[] // add extra params to setting handleOpen function, and it use spread operator
  }>(),
  {
    showSkeleton: false,
    hideSetting: false,
    title: '',
    subtitle: '',
    footer: '',
    additionalStyle: () => ({}),
    extraParams: [],
    mode: 'real',
    showRefreshIcon: true,
    showFullscreenIcon: true
  }
)
const cardRef = ref<any>()
const fullscreen = ref(false)
const fullscreenTransform = ref('none')

function openFullscreen() {
  // get parent element and found if there any transform
  const cardElement = cardRef.value?.$el as HTMLElement
  const parentElement = cardElement.parentElement as HTMLElement
  if (!cardElement) return
  const transform = getComputedStyle(parentElement).transform
  fullscreenTransform.value = transform
  parentElement.style.transform = ''
  const ev: any = new CustomEvent('fullscreenchange')
  cardElement.dispatchEvent(ev)
}
function exitFullscreen() {
  const cardElement = cardRef.value?.$el as HTMLElement
  const parentElement = cardElement.parentElement as HTMLElement
  parentElement.style.transform = fullscreenTransform.value
  const ev: any = new CustomEvent('fullscreenchange')
  cardElement.dispatchEvent(ev)
}
function toggleFullscreen() {
  if (fullscreen.value) {
    exitFullscreen()
    fullscreen.value = false
  } else {
    openFullscreen()
    fullscreen.value = true
  }
}
function resize() {}

function openSetting() {
  console.log(props.settingRef, props.setting)

  if (!!props.settingRef) props.settingRef.handleOpen(props.setting, ...props.extraParams)
  else emits('openSetting', props.setting)
}
function handleRefresh() {
  emits('refresh', props.setting)
}
async function handleDelete() {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    emits('delete')
  } catch (error) {
    console.error(error)
  }
}

defineExpose({
  resize
})
</script>

<template>
  <ElCard ref="cardRef" :class="['dp-dashboard--card', { fullscreen: fullscreen }]" :style="additionalStyle">
    <template #header>
      <slot name="header">
        <div class="dp-dashboard--card__title-wrap">
          <h4 class="dp-dashboard--card__title">
            {{ title }}
            <slot name="title_suffix"></slot>
          </h4>
          <p v-if="subtitle" class="dp-dashboard--card__subtitle">{{ subtitle }}</p>
        </div>

        <div class="flex-x-end">
          <slot name="action_prefix"></slot>
          <!-- FUll screen toggle button -->
          <SvgIcon v-if="showRefreshIcon" id="refresh" src="/icons/refresh.svg" @click="handleRefresh" />
          <Icon
            v-if="showFullscreenIcon"
            :name="fullscreen ? 'material-symbols:fullscreen-exit-rounded' : 'material-symbols:fullscreen'"
            @click="toggleFullscreen"
          />
          <SvgIcon v-if="!hideSetting && settingRef && mode === 'real'" class="" id="setting" src="/icons/setting.svg" @click="openSetting" />
          <SvgIcon v-if="!hideSetting && !fullscreen && mode === 'real'" class="setting--icon" id="delete" src="/icons/delete.svg" @click="handleDelete" />
        </div>
      </slot>
    </template>
    <el-skeleton v-if="showSkeleton" :rows="5"> </el-skeleton>
    <slot v-else></slot>
    <div v-if="footer || $slots.footer" class="dp-dashboard--card__footer">
      <slot name="footer">
        <span>{{ footer }}</span>
      </slot>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 2 !important;
}
.el-card {
  --dashboard-item-padding: var(--app-space-s) !important;

  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
  container-type: size;
  border-radius: 6px;
  border: 1px solid var(--app-grey-900);
}
:deep(.el-card__header) {
  margin: 0;
  --icon-size: 1.2rem;
  --icon-color: var(--app-grey-700);
  padding: var(--app-space-s) var(--app-space-s) 0 var(--app-space-s) !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: unset;
  width: 100%;
  overflow: hidden;
  .svgIcon + .svgIcon {
    margin-left: var(--app-space-xxs);
  }
  .dp-dashboard--card__title-wrap {
    max-width: calc(100% - 4rem);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .dp-dashboard--card__title {
    font-size: var(--app-font-size-l);
    margin-bottom: var(--app-space-s);
    .el-dropdown {
      padding-top: 3px;
    }
  }
  .dp-dashboard--card__subtitle {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
    margin: 0;
    padding: 0;
    line-height: 1.2;
  }
}
.dp-dashboard--card__padding {
  padding: var(--app-space-xs);
  :deep(.el-card__body) {
    padding: var(--el-card-padding);
  }
  :deep(.el-card__header) {
    // padding: var(--el-card-padding) !important;
  }
}
.dp-dashboard--card__scroll {
  :deep(.el-card__body) {
    overflow: auto;
  }
}
:deep(.el-card__body) {
  padding: 0;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dp-dashboard--card__footer {
  padding: var(--app-space-xs) var(--app-space-s);
  border-top: 1px solid var(--app-grey-900);
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  text-align: center;
}
:deep(h4) {
  padding: unset;
  margin: unset;
  flex: 1 0 auto;
}
:deep(.table-container) {
  height: 100%;
  overflow: hidden;
  .vxe-toolbar {
    display: none;
  }
}
:deep(.tab-container) {
  .el-tabs__header {
    margin-bottom: 0;
  }
}
:deep(.iconify) {
  width: 1.2rem;
  height: 1.2rem;
  background-color: var(--app-grey-600);
}
:deep(.iconify.icon-right) {
  margin-right: var(--app-space-xxs);
  cursor: pointer;
}
</style>
