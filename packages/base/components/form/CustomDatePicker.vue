<template>
  <div ref="wrapperRef" class="custom-date-picker">
    <!-- Native picker (invisible, provides layout height + panel logic) -->
    <ElDatePicker
      ref="pickerRef"
      :model-value="pickerValue"
      type="date"
      :format="format"
      :value-format="valueFormat"
      :disabled="disabled"
      :disabled-date="disabledDate"
      :clearable="false"
      :automatic-dropdown="false"
      class="custom-date-picker__native"
      @update:model-value="handleCalendarChange"
    />

    <!-- Overlay input: solid background, handles typing & opens panel on click -->
    <ElInput
      v-model="displayValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :clearable="clearable"
      maxlength="10"
      class="custom-date-picker__overlay"
      @click="handleClick"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleEnter"
      @keydown.esc="pickerRef?.handleClose?.()"
      @clear="handleClear"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ElDatePicker } from 'element-plus'

dayjs.extend(customParseFormat)

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    format?: string
    valueFormat?: string
    placeholder?: string
    disabled?: boolean
    clearable?: boolean
    disabledDate?: (date: Date) => boolean
  }>(),
  {
    format: 'DD/MM/YYYY',
    placeholder: '',
    disabled: false,
    clearable: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'change', value: string | null): void
  (e: 'focus', evt: FocusEvent): void
  (e: 'blur', evt: FocusEvent): void
}>()

const pickerRef = ref<InstanceType<typeof ElDatePicker>>()
const wrapperRef = ref<HTMLElement>()
const pickerValue = ref<string | Date | null>(props.modelValue || null)
const displayValue = ref('')

/* ------------------------------------------------------------------ */
/*  Sync from parent                                                   */
/* ------------------------------------------------------------------ */

watch(
  () => props.modelValue,
  (val) => {
    pickerValue.value = val || null
    if (!val) {
      displayValue.value = ''
      return
    }
    const d = dayjs(val, props.valueFormat || props.format, true)
    displayValue.value = d.isValid() ? d.format(props.format) : String(val)
  },
  { immediate: true }
)

/* ------------------------------------------------------------------ */
/*  Parser: normalize separators → extract DD/MM/YYYY → validate     */
/* ------------------------------------------------------------------ */

function parseDateInput(input: string): dayjs.Dayjs | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const fmt = props.valueFormat || props.format
  let normalized = trimmed

  // 1. No separator & all digits → insert separators from format
  if (!/[^0-9]/.test(trimmed)) {
    const tokens = fmt.match(/(YYYY|MM|DD)/g)
    if (tokens && tokens.length === 3 && trimmed.length === 8) {
      let pos = 0
      let reconstructed = fmt
      for (const token of tokens) {
        const len = token === 'YYYY' ? 4 : 2
        reconstructed = reconstructed.replace(token, trimmed.substring(pos, pos + len))
        pos += len
      }
      normalized = reconstructed
    }
  }

  // 2. Split format and value by non-alphanumeric / non-digit
  const fmtParts = fmt.split(/[^A-Za-z0-9]/).filter(Boolean)
  const valParts = normalized.split(/[^0-9]/).filter(Boolean)

  if (fmtParts.length !== valParts.length) return null

  let dd: number | null = null
  let mm: number | null = null
  let yyyy: number | null = null

  for (let i = 0; i < fmtParts.length; i++) {
    const token = fmtParts[i]
    const val = parseInt(valParts[i], 10)
    if (isNaN(val)) return null

    if (token === 'DD') dd = val
    else if (token === 'MM') mm = val
    else if (token === 'YYYY') yyyy = val
  }

  if (dd === null || mm === null || yyyy === null) return null

  // 3. Detect DD/MM flip
  if (mm > 12 && dd <= 12) {
    const tmp = mm
    mm = dd
    dd = tmp
  }

  // 4. Validate ranges
  if (mm < 1 || mm > 12) return null
  if (yyyy < 1900 || yyyy > 2999) return null

  const maxDay = new Date(yyyy, mm, 0).getDate()
  if (dd < 1 || dd > maxDay) return null

  // 5. Build strict dayjs
  const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  const d = dayjs(iso, 'YYYY-MM-DD', true)
  return d.isValid() ? d : null
}

/* ------------------------------------------------------------------ */
/*  Commit typed text                                                  */
/* ------------------------------------------------------------------ */

function applyInput() {
  const d = parseDateInput(displayValue.value)
  if (d) {
    const vf = props.valueFormat || props.format
    const newValue = d.format(vf)
    if (newValue !== props.modelValue) {
      pickerValue.value = newValue
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }
    displayValue.value = d.format(props.format)
  } else if (!displayValue.value.trim()) {
    if (props.modelValue) {
      pickerValue.value = null
      emit('update:modelValue', null)
      emit('change', null)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Calendar pick                                                      */
/* ------------------------------------------------------------------ */

function handleCalendarChange(val: string | Date | null) {
  if (!val) {
    pickerValue.value = null
    displayValue.value = ''
    emit('update:modelValue', null)
    emit('change', null)
    return
  }

  const vf = props.valueFormat || props.format
  const d = typeof val === 'string' ? dayjs(val, vf, true) : dayjs(val)
  if (!d || !d.isValid()) return

  const newValue = d.format(vf)
  const newDisplay = d.format(props.format)

  pickerValue.value = newValue
  displayValue.value = newDisplay

  if (newValue !== props.modelValue) {
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }
}

/* ------------------------------------------------------------------ */
/*  Events                                                             */
/* ------------------------------------------------------------------ */

function handleClick(e: MouseEvent) {
  // Don't reopen panel when clicking the clear icon
  const target = e.target as HTMLElement
  if (target?.closest?.('.el-input__clear')) return
  if (!props.disabled) pickerRef.value?.handleOpen?.()
}

function handleFocus(e: FocusEvent) {
  emit('focus', e)
}

function handleBlur(e: FocusEvent) {
  emit('blur', e)

  const d = parseDateInput(displayValue.value)
  if (d) {
    // Valid → commit
    const vf = props.valueFormat || props.format
    const newValue = d.format(vf)
    if (newValue !== props.modelValue) {
      pickerValue.value = newValue
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }
    displayValue.value = d.format(props.format)
  } else if (!displayValue.value.trim()) {
    // Empty → clear
    if (props.modelValue) {
      pickerValue.value = null
      emit('update:modelValue', null)
      emit('change', null)
    }
  } else {
    // INVALID → reset back to current modelValue
    const current = props.modelValue
      ? dayjs(props.modelValue, props.valueFormat || props.format, true)
      : null
    displayValue.value = current?.isValid()
      ? current.format(props.format)
      : ''
  }

  // Give the panel time to process a click before closing
  setTimeout(() => {
    const active = document.activeElement
    const insidePanel = active?.closest?.('.el-picker__popper') || active?.closest?.('.el-popper')
    if (!insidePanel) pickerRef.value?.handleClose?.()
  }, 150)
}

function handleEnter() {
  applyInput()
  pickerRef.value?.handleClose?.()
}

function handleClear() {
  pickerValue.value = null
  displayValue.value = ''
  emit('update:modelValue', null)
  emit('change', null)
}
</script>

<style lang="scss" scoped>
.custom-date-picker {
  position: relative;
  display: inline-block;
  width: 100%;

  &__native {
    width: 100%;
    opacity: 0;
    pointer-events: none;
  }

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    /* Remove extra shadow so we don't double-border with the hidden native picker */
    :deep(.el-input__wrapper) {
      /* box-shadow: none !important; */
    }
  }
}
</style>
