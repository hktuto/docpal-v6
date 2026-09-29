<script setup lang="ts">
const { t } = useI18n()
const visible = ref(false)
const groups = ref<any[]>([])
const activeIndex = ref(0)
const panelRef = ref<{ reload: () => void } | null>(null)

/** 同一分組內必須一致的字段 → i18n key */
const GROUPING_FIELDS = [
  { field: 'office', labelKey: 'proformaInvoice.office' },
  { field: 'customer_code', labelKey: 'proformaInvoice.customerCode' },
  { field: 'currency', labelKey: 'proformaInvoice.currency' },
  { field: 'warehouseLocation', labelKey: 'proformaInvoice.warehouseLocation' },
  { field: 'sub_inventory', labelKey: 'proformaInvoice.subInventory' },
  { field: 'bill_to_location', labelKey: 'proformaInvoice.billToLocation' },
  { field: 'ship_to_location', labelKey: 'proformaInvoice.shipToLocation' }
] as const

let pending: {
  resolve: () => void
  reject: (reason?: Error) => void
} | null = null

const activeInvoice = computed(() => groups.value[activeIndex.value] ?? null)

function formatAmount(value: number | string | undefined) {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return String(value ?? '')
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function groupSummary(invoice: any) {
  const code = invoice.customer_code || '—'
  const count = invoice.items?.length ?? 0
  return `${code} · ${t('proformaInvoice.linesCount', { count })} · ${formatAmount(invoice.total_amount)}`
}

function normalizeInvoices(invoices: any[] | Record<string, any> = []): any[] {
  if (Array.isArray(invoices)) return invoices
  return Object.entries(invoices).map(([grouping, invoice]) => ({
    ...invoice,
    grouping: Number(grouping) || grouping
  }))
}

/**
 * 校驗同一分組內關鍵字段是否一致，返回不一致字段的展示文案
 */
function checkGrouping(invoice: any): string[] {
  const items = invoice?.items
  if (!Array.isArray(items) || items.length <= 1) return []

  const mismatches: string[] = []
  for (const { field, labelKey } of GROUPING_FIELDS) {
    const values = new Set(items.map((item) => String(item[field] ?? '')))
    if (values.size > 1) {
      mismatches.push(`${t(labelKey)}: ${[...values].join(' / ')}`)
    }
  }
  return mismatches
}

function open(invoices: any[] | Record<string, any> = []) {
  const list = normalizeInvoices(invoices).map((invoice) => ({
    ...invoice,
    groupingMismatches: checkGrouping(invoice)
  }))

  groups.value = list
  activeIndex.value = 0
  visible.value = true
  nextTick(() => panelRef.value?.reload())
  return new Promise<void>((resolve, reject) => {
    pending = { resolve, reject }
  })
}

function settle(confirmed: boolean) {
  if (!pending) return
  const { resolve, reject } = pending
  pending = null
  visible.value = false
  if (confirmed) resolve()
  else reject(new Error('cancelled'))
}

function handleSelectGroup(index: number) {
  activeIndex.value = index
  nextTick(() => panelRef.value?.reload())
}

function handleSubmit() {
  settle(true)
}

function handleClose() {
  settle(false)
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('proformaInvoice.previewTitle')"
    class="big"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    @close="handleClose"
  >
    <div class="pi-preview">
      <div class="pi-preview__banner">
        {{ t('proformaInvoice.submissionWillCreate', { count: groups.length }) }}
      </div>

      <div class="pi-preview__body">
        <aside class="pi-preview__sidebar">
          <h3 class="pi-preview__sidebar-title">{{ t('proformaInvoice.groupingList') }}</h3>
          <button
            v-for="(invoice, index) in groups"
            :key="`${invoice.grouping}-${index}`"
            type="button"
            class="pi-preview__group"
            :class="{
              'is-active': index === activeIndex,
              'is-mismatch': invoice.groupingMismatches?.length
            }"
            tabindex="0"
            :aria-label="t('proformaInvoice.groupingN', { n: invoice.grouping })"
            @click="handleSelectGroup(index)"
            @keydown.enter="handleSelectGroup(index)"
          >
            <span class="pi-preview__group-title">{{ t('proformaInvoice.groupingN', { n: invoice.grouping }) }}</span>
            <span class="pi-preview__group-meta">{{ groupSummary(invoice) }}</span>
          </button>
        </aside>

        <main v-if="activeInvoice" class="pi-preview__main">
          <div v-if="activeInvoice.groupingMismatches?.length" class="pi-preview__mismatch">
            <p class="pi-preview__mismatch-title">
              {{ t('proformaInvoice.groupingFieldsInconsistent', { grouping: activeInvoice.grouping }) }}
            </p>
            <ul class="pi-preview__mismatch-list">
              <li v-for="(item, i) in activeInvoice.groupingMismatches" :key="i">
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="pi-preview__main-head">
            <h3>
              {{
                t('proformaInvoice.invoiceOf', {
                  current: activeIndex + 1,
                  total: groups.length,
                  grouping: activeInvoice.grouping
                })
              }}
            </h3>
          </div>
          <LazyFormWidgetProformaInvoicePreviewPanel ref="panelRef" v-model:invoice="groups[activeIndex]" />
        </main>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ t('common_back') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ t('proformaInvoice.confirmSubmit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.pi-preview {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  min-height: 520px;

  &__banner {
    padding: 10px 14px;
    border: 1px solid var(--app-primary-2);
    border-radius: var(--app-border-radius-s);
    background: var(--app-primary-alpha-10);
    color: var(--app-primary-5);
    font-size: var(--app-font-size-s);
    text-align: center;
  }

  &__body {
    display: flex;
    gap: 0;
    min-height: 460px;
  }

  &__sidebar {
    flex: 0 0 220px;
    padding-right: var(--app-space-s);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__sidebar-title {
    margin: 0;
    color: #1e3a5f;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  &__group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-border-radius-m);
    background: #fff;
    color: #1e3a5f;
    text-align: left;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;

    &.is-active {
      background: var(--app-primary-color);
      border-color: var(--app-primary-color);
      color: #fff;

      .pi-preview__group-meta {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    &.is-mismatch:not(.is-active) {
      border-color: var(--el-color-danger);
    }

    &.is-mismatch.is-active {
      background: var(--el-color-danger);
      border-color: var(--el-color-danger);
    }
  }

  &__group-title {
    font-size: 14px;
    font-weight: 700;
  }

  &__group-meta {
    font-size: 12px;
    color: var(--app-text-secondary);
    line-height: 1.4;
    word-break: break-all;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }

  &__mismatch {
    padding: 10px 14px;
    border: 1px solid var(--el-color-danger-light-5);
    border-radius: var(--app-border-radius-s);
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    font-size: var(--app-font-size-s);
  }

  &__mismatch-title {
    margin: 0 0 6px;
    font-weight: 700;
  }

  &__mismatch-list {
    margin: 0;
    padding-left: 1.2em;
    line-height: 1.5;
    word-break: break-all;
  }

  &__main-head {
    border-top: 2px solid #1e3a5f;
    padding-top: 10px;

    h3 {
      margin: 0;
      color: #1e3a5f;
      font-size: 16px;
      font-weight: 700;
    }
  }
}
</style>
