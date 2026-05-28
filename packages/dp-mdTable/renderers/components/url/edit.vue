<script setup lang="ts">
import { EditPen, TopRight } from '@element-plus/icons-vue'

const props = defineProps<{
  row: Record<string, unknown>
  column: { field: string }
  onMouseenter?: (e: MouseEvent) => void
  onMouseleave?: (e: MouseEvent) => void
}>()

const { t } = useI18n()

type UrlCellValue = { text: string; title: string }

function getUrlData(): UrlCellValue {
  const raw = props.row[props.column.field]
  const arr = Array.isArray(raw) ? raw : []
  const item = arr.length > 0 ? (arr[0] as UrlCellValue) : null
  return { text: item?.text ?? '', title: item?.title ?? '' }
}

function setUrlData(data: UrlCellValue) {
  props.row[props.column.field] = [data]
}

const cellText = computed({
  get: () => getUrlData().text,
  set: (value: string) => {
    const current = getUrlData()
    setUrlData({ text: value, title: current.title || value })
  }
})

const popoverVisible = ref(false)
const draftText = ref('')
const draftTitle = ref('')
const inputRef = ref<InstanceType<typeof ElInput>>()

function handleOpenPopover() {
  const data = getUrlData()
  draftText.value = data.text
  draftTitle.value = data.title
  popoverVisible.value = true
}

function handleConfirm() {
  setUrlData({ text: draftText.value.trim(), title: draftTitle.value.trim() })
  popoverVisible.value = false
}

function handleCancel() {
  popoverVisible.value = false
}

function handleOpenLink() {
  const url = draftText.value.trim()
  if (!url) return
  const urlText = /^https?:\/\//i.test(url) ? url : `https://${url}`
  window.open(urlText, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus?.()
  })
})
</script>

<template>
  <div class="url-edit-cell" @mouseenter="onMouseenter" @mouseleave="onMouseleave">
    <ElPopover
      v-model:visible="popoverVisible"
      :width="280"
      placement="bottom-start"
      trigger="manual"
      popper-class="url-edit-popover vxe-table--ignore-clear"
      :teleported="true"
    >
      <template #reference>
        <ElInput ref="inputRef" v-model="cellText" class="vxe-cell-absolute mdTable-height-edit mdTable-input-radius url-edit-cell__input" @click.stop>
          <template #suffix>
            <ElIcon
              class="url-edit-cell__edit-icon"
              tabindex="0"
              role="button"
              :aria-label="t('editor.url.set')"
              @click.stop="handleOpenPopover"
              @keydown.enter.stop="handleOpenPopover"
            >
              <EditPen />
            </ElIcon>
          </template>
        </ElInput>
      </template>

      <div class="url-edit-form" @mousedown.stop>
        <div class="url-edit-form__field">
          <label class="url-edit-form__label">{{ t('editor.url.link') }}</label>
          <ElInput v-model="draftText" clearable>
            <template #suffix>
              <ElIcon
                class="url-edit-form__link-icon"
                tabindex="0"
                role="button"
                :aria-label="t('editor.url.link')"
                @click="handleOpenLink"
                @keydown.enter="handleOpenLink"
              >
                <TopRight />
              </ElIcon>
            </template>
          </ElInput>
        </div>
        <div class="url-edit-form__field">
          <label class="url-edit-form__label">{{ t('common_title') }}</label>
          <ElInput v-model="draftTitle" clearable />
        </div>
        <div class="url-edit-form__actions">
          <ElButton text @click="handleCancel">{{ t('cancelText') }}</ElButton>
          <ElButton type="primary" @click="handleConfirm">{{ t('confirm') }}</ElButton>
        </div>
      </div>
    </ElPopover>
  </div>
</template>

<style scoped lang="scss">
.url-edit-cell {
  width: 100%;
  height: 100%;
}

.url-edit-cell__input {
  width: 100%;
}

.url-edit-cell__edit-icon {
  cursor: pointer;
  color: var(--app-text-color-secondary);

  &:hover {
    color: var(--el-color-primary);
  }
}

.url-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);
  }

  &__label {
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-regular);
    line-height: 1.2;
  }

  &__link-icon {
    cursor: pointer;
    color: var(--app-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--app-space-xs);
    margin-top: var(--app-space-xs);
  }
}
</style>

<style lang="scss">
.url-edit-popover.el-popover {
  padding: var(--app-space-s);
}
</style>
