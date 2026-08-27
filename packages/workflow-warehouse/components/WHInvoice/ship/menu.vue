<script setup lang="ts">
import { useShipVerifyInject, type ShipInvoice } from '../../../composables/useShipVerify'

const { invoiceList, selectedInvoice, selectInvoice } = useShipVerifyInject()

const selectedFileName = computed(() => selectedInvoice.value?.fileName || '')

function handleSelect(item: ShipInvoice) {
  selectInvoice(item)
}

function handleKeydown(event: KeyboardEvent, item: ShipInvoice) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleSelect(item)
  }
}
</script>

<template>
  <div class="ship-menu">
    <button
      v-for="item in invoiceList"
      :key="item.id"
      type="button"
      class="invoice-chip"
      :class="{ 'is-selected': selectedInvoice?.id === item.id }"
      tabindex="0"
      :aria-label="item.invoiceNum"
      :aria-pressed="selectedInvoice?.id === item.id"
      @click="handleSelect(item)"
      @keydown="handleKeydown($event, item)"
    >
      {{ item.invoiceNum || '—' }}
    </button>
    <span
      v-if="selectedFileName"
      class="file-link"
    >
      {{ selectedFileName }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.ship-menu {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: var(--app-space-s);
}

.invoice-chip {
  border: 1px solid var(--el-color-primary);
  border-radius: 999px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  padding: 0.25rem 0.75rem;
  cursor: pointer;

  &.is-selected {
    background-color: var(--el-color-primary);
    color: var(--el-color-white);
  }
}

.file-link {
  color: var(--el-color-primary);
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}
</style>
