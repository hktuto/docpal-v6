<script lang="ts" setup>
import { useRelationAnalysis } from '../../../composables/useRelationAnalysis'

const { analysis, analysisList } = useRelationAnalysis()

const buttonRef = ref<HTMLElement>()
const analyzePopoverRef = ref()

function analysisStatusLabel() {
  const s = analysis.value.status
  if (s === 'pending') return analysis.value.jobId ? 'Analysis pending...' : 'Analyze Relations'
  if (s === 'processing') return 'Analyzing...'
  if (s === 'failed') return analysis.value.message || 'Analysis failed'
  const count = analysisList.value.length
  if (count > 0) return `${count} relation${count === 1 ? '' : 's'} found`
  return 'No relations found'
}

function analysisDotClass() {
  const s = analysis.value.status
  if (s === 'pending' && analysis.value.jobId) return 'is-analyzing'
  if (s === 'processing') return 'is-analyzing'
  if (s === 'failed') return 'is-error'
  if (analysisList.value.length > 0) return 'is-success'
  return ''
}

function handleOpenPopover() {
  if (analysis.value.status === 'pending' && analysis.value.jobId) return
  if (analysis.value.status === 'processing') return
  if (!buttonRef.value) return
  analyzePopoverRef.value?.open(buttonRef.value)
}
</script>

<template>
  <div
    ref="buttonRef"
    class="analysis-status"
    :class="{ 'is-clickable': analysis.status === 'completed' }"
    @click="handleOpenPopover"
  >
    <span class="analysis-dot" :class="analysisDotClass()" />
    <span class="analysis-text">{{ analysisStatusLabel() }}</span>
    <Icon
      v-if="(analysis.status === 'pending' && analysis.jobId) || analysis.status === 'processing'"
      name="svg-spinners:180-ring"
      size="14"
      class="analysis-spinner"
    />
  </div>

  <DatabaseRelationAnalyzePopover ref="analyzePopoverRef" />
</template>

<style lang="scss" scoped>
.analysis-status {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  margin-right: var(--app-space-s);
  font-size: var(--app-font-size-s);
  color: var(--app-grey-500);
  user-select: none;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .analysis-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--app-grey-600);
    transition: background-color 0.2s;

    &.is-analyzing {
      background-color: var(--el-color-primary);
      animation: analysis-pulse 1.5s infinite;
    }

    &.is-success {
      background-color: #10b981;
    }

    &.is-error {
      background-color: var(--el-color-danger);
    }
  }

  .analysis-text {
    white-space: nowrap;
  }

  .analysis-spinner {
    color: var(--el-color-primary);
  }
}

@keyframes analysis-pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
</style>
