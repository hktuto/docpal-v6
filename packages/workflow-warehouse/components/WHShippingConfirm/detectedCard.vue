<script setup lang="ts">
import { CircleCheckFilled, Loading } from '@element-plus/icons-vue'
import { useShippingConfirmInject } from '../../composables/useShippingConfirm'

const { errorMessage, finalStatus, isFailure, isProcessing, isSuccess, loading, pollingTimedOut, requestErrorMessage, summary } = useShippingConfirmInject()

const { t } = useI18n()
</script>

<template>
  <div class="detected-card">
    <div class="detected-card-header">
      <div>
        <h3 class="detected-card-title">{{ $t('workflowWarehouse.detectedIssues') }}</h3>
        <p class="detected-card-subtitle">{{ $t('workflowWarehouse.detectedIssuesSubtitle') }}</p>
      </div>
      <el-tag v-if="finalStatus" size="small" effect="light">{{ finalStatus }}</el-tag>
    </div>

    <div v-if="loading || isProcessing" class="status-block is-processing">
      <el-icon class="status-icon is-rotating" aria-hidden="true">
        <Loading />
      </el-icon>
      <div>
        <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmProcessing') }}</p>
        <p class="status-copy">{{ summary }}</p>
      </div>
    </div>

    <div v-else-if="isSuccess" class="status-block is-success">
      <el-icon class="status-icon is-success" aria-hidden="true">
        <CircleCheckFilled />
      </el-icon>
      <div>
        <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmSucceeded') }}</p>
        <p class="status-copy">{{ summary }}</p>
      </div>
    </div>

    <div v-else-if="isFailure" class="status-block is-failure">
      <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmNeedsReview') }}</p>
      <p class="status-copy">{{ summary }}</p>
    </div>

    <div v-else-if="errorMessage || requestErrorMessage || pollingTimedOut" class="status-block is-error">
      <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmFetchFailed') }}</p>
      <p class="status-copy">
        {{ errorMessage || requestErrorMessage || $t('workflowWarehouse.shippingConfirmPollingTimeoutSummary') }}
      </p>
    </div>

    <div v-else class="status-block">
      <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmPendingResult') }}</p>
      <p class="status-copy">{{ summary }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.detected-card {
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.detected-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

.detected-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detected-card-subtitle {
  margin: var(--app-space-xxs) 0 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  color: var(--el-text-color-regular);

  &.is-processing,
  &.is-success {
    flex-direction: row;
    align-items: flex-start;
  }
}

.status-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 1.125rem;

  &.is-success {
    color: var(--el-color-success);
  }
}

.is-rotating {
  color: var(--el-color-primary);
  animation: rotating 1s linear infinite;
}

.status-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.status-copy {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
