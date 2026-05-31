<script setup lang="ts">
import { EditPen, TopRight } from '@element-plus/icons-vue'

type UrlCellValue = {
  text: string
  title: string
}

const props = defineProps<{
  formData: Record<string, unknown>
  column: Record<string, any>
  fieldName: string
  disabled: boolean
}>()

const { t } = useI18n()
const fieldKey = computed(() => props.column?.[props.fieldName] as string | undefined)
const openPopoverIndex = ref<number | null>(null)
const editingIndex = ref<number | null>(null)
const draftText = ref('')
const draftTitle = ref('')
const faviconLoadFailedMap = ref<Record<number, boolean>>({})

const urls = computed((): UrlCellValue[] => {
  const key = fieldKey.value
  if (!key) return []

  const raw = props.formData[key]
  if (Array.isArray(raw)) {
    return raw.map(normalizeUrlCell)
  }

  if (typeof raw === 'string' && raw.trim()) {
    return [{ text: raw.trim(), title: raw.trim() }]
  }

  return []
})

const rules = computed(() => {
  if (!props.column?.required) return []

  return [
    {
      required: true,
      trigger: 'change',
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (hasValidUrlValue(value)) {
          callback()
          return
        }
        callback(new Error('请输入链接'))
      }
    }
  ]
})

function normalizeUrlCell(item: unknown): UrlCellValue {
  if (!item || typeof item !== 'object') {
    return { text: '', title: '' }
  }

  const cell = item as Partial<UrlCellValue>
  return {
    text: typeof cell.text === 'string' ? cell.text : '',
    title: typeof cell.title === 'string' ? cell.title : ''
  }
}

function hasValidUrlValue(value: unknown) {
  if (!Array.isArray(value)) return false

  return value.some((item) => {
    const text = (item as Partial<UrlCellValue>)?.text
    return typeof text === 'string' && text.trim().length > 0
  })
}

function setUrls(list: UrlCellValue[]) {
  const key = fieldKey.value
  if (!key) return

  props.formData[key] = list
    .map((item) => ({
      text: item.text.trim(),
      title: item.title.trim()
    }))
    .filter((item) => item.text || item.title)
}

function getWebsiteFavicon(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  try {
    const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const domain = new URL(normalizedUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function isFaviconFailed(index: number) {
  return faviconLoadFailedMap.value[index] === true
}

function handleFaviconError(index: number) {
  faviconLoadFailedMap.value = { ...faviconLoadFailedMap.value, [index]: true }
}

function handleUpdateText(index: number, text: string) {
  const list = [...urls.value]
  const current = list[index] ?? { text: '', title: '' }
  list[index] = { text, title: current.title || text }
  setUrls(list)
  const nextMap = { ...faviconLoadFailedMap.value }
  delete nextMap[index]
  faviconLoadFailedMap.value = nextMap
}

function handleOpenPopover(index: number) {
  if (props.disabled) return

  const item = urls.value[index]
  editingIndex.value = index
  draftText.value = item?.text ?? ''
  draftTitle.value = item?.title ?? ''
  openPopoverIndex.value = index
}

function handlePopoverVisibleChange(index: number, visible: boolean) {
  if (visible) {
    handleOpenPopover(index)
    return
  }

  if (openPopoverIndex.value === index) {
    openPopoverIndex.value = null
    editingIndex.value = null
  }
}

function handleConfirm() {
  const index = editingIndex.value
  if (index === null) return

  const list = [...urls.value]
  list[index] = {
    text: draftText.value.trim(),
    title: draftTitle.value.trim()
  }
  setUrls(list)
  openPopoverIndex.value = null
  editingIndex.value = null
}

function handleCancel() {
  openPopoverIndex.value = null
  editingIndex.value = null
}

function handleOpenLink() {
  const url = draftText.value.trim()
  if (!url) return

  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
  window.open(normalizedUrl, '_blank', 'noopener,noreferrer')
}

function handleAddUrl() {
  const key = fieldKey.value
  if (!key || props.disabled) return

  props.formData[key] = [...urls.value, { text: '', title: '' }]
}
</script>

<template>
  <MdFormItem v-bind="props" :rules="rules">
    <div v-if="formData && fieldKey" class="url-form-field-list">
      <ElInput
        v-for="(item, index) in urls"
        :key="index"
        :model-value="item.text"
        type="url"
        :placeholder="column.placeholder"
        :disabled="disabled"
        clearable
        @update:model-value="(value) => handleUpdateText(index, value)"
      >
        <template #prefix>
          <img
            v-if="getWebsiteFavicon(item.text) && !isFaviconFailed(index)"
            class="url-form-field__favicon"
            :src="getWebsiteFavicon(item.text)"
            alt=""
            aria-hidden="true"
            @error="handleFaviconError(index)"
          />
          <Icon v-else name="lucide:link" size="14" aria-hidden="true" />
        </template>
        <template #suffix>
          <ElPopover
            :visible="openPopoverIndex === index"
            :width="280"
            placement="bottom-end"
            trigger="manual"
            popper-class="url-form-field-popover"
            :teleported="true"
            @update:visible="(visible) => handlePopoverVisibleChange(index, visible)"
          >
            <template #reference>
              <ElIcon
                class="url-form-field__edit-icon"
                role="button"
                :tabindex="disabled ? -1 : 0"
                :aria-disabled="disabled"
                :aria-label="t('editor.url.set')"
                @click.stop="handleOpenPopover(index)"
                @keydown.enter.stop.prevent="handleOpenPopover(index)"
              >
                <EditPen />
              </ElIcon>
            </template>

            <div class="url-form-field" @mousedown.stop>
              <div class="url-form-field__item">
                <label class="url-form-field__label">{{ t('editor.url.link') }}</label>
                <ElInput v-model="draftText" clearable>
                  <template #suffix>
                    <ElIcon class="url-form-field__link-icon" tabindex="0" role="button" :aria-label="t('editor.url.link')" @click="handleOpenLink" @keydown.enter="handleOpenLink">
                      <TopRight />
                    </ElIcon>
                  </template>
                </ElInput>
              </div>
              <div class="url-form-field__item">
                <label class="url-form-field__label">{{ t('editor.url.title') }}</label>
                <ElInput v-model="draftTitle" clearable />
              </div>
              <div class="url-form-field__actions">
                <ElButton text @click="handleCancel">{{ t('cancelText') }}</ElButton>
                <ElButton type="primary" @click="handleConfirm">{{ t('confirm') }}</ElButton>
              </div>
            </div>
          </ElPopover>
        </template>
      </ElInput>

      <!-- <div v-if="!disabled" class="url-form-field__footer">
        <ElButton type="primary" size="small" :aria-label="t('Add')" @click="handleAddUrl">
          <ElIcon class="url-form-field__add-icon">
            <Plus />
          </ElIcon>
          {{ t('Add') }}
        </ElButton>
      </div> -->
    </div>
  </MdFormItem>
</template>

<style scoped lang="scss">
.url-form-field-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  width: 100%;
}

.url-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);
}

.url-form-field__item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.url-form-field__label {
  font-size: var(--app-font-size-s);
  line-height: 1.2;
  color: var(--app-text-color-regular);
}

.url-form-field__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-xs);
  margin-top: var(--app-space-xs);
}

.url-form-field__footer {
  width: 100%;
}

.url-form-field__favicon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  object-fit: contain;
}

.url-form-field__add-icon {
  color: var(--el-color-white);
}

.url-form-field__edit-icon,
.url-form-field__link-icon {
  cursor: pointer;
  color: var(--app-text-color-secondary);
}

.url-form-field__edit-icon[aria-disabled='true'] {
  cursor: not-allowed;
}

.url-form-field__edit-icon:not([aria-disabled='true']):hover,
.url-form-field__link-icon:hover {
  color: var(--el-color-primary);
}
</style>

<style lang="scss">
.url-form-field-popover.el-popover {
  padding: var(--app-space-s);
}
</style>
