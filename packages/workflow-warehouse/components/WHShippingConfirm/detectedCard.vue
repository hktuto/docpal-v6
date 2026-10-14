<script setup lang="ts">
import { CircleCheckFilled, Loading } from '@element-plus/icons-vue'
import { useShippingConfirmInject } from '../../composables/useShippingConfirm'
import type { ShippingConfirmRuleIssue } from '../../composables/useShippingConfirm'

const {
  errorMessage,
  finalStatus,
  isFailure,
  isProcessing,
  isSuccess,
  issues,
  loading,
  normalizedCompare,
  pollingTimedOut,
  requestErrorMessage,
  resolveIssueTitle,
  summary
} = useShippingConfirmInject()

const { t } = useI18n()

const successValidations = computed(() => normalizedCompare.value.validations)

function isMissingIssue(issue: ShippingConfirmRuleIssue) {
  return issue.status === 'missing'
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function shouldShowIssueValue(issue: ShippingConfirmRuleIssue) {
  return !!formatValue(issue.source_value) || !!formatValue(issue.ocr_value)
}
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
      <div class="status-success-copy">
        <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmSucceeded') }}</p>
        <p class="status-copy">{{ summary }}</p>
      </div>
      <el-collapse v-if="successValidations.length" class="validations-collapse">
        <el-collapse-item :title="$t('workflowWarehouse.shippingConfirmValidations')" name="validations">
          <ul v-if="successValidations.length" class="validation-list">
            <li v-for="(item, index) in successValidations" :key="index" class="validation-item">
              <span class="validation-item__status" :class="item.status">
                {{ item.status }}
              </span>
              <span class="validation-item__label">
                {{ resolveIssueTitle(item) }}
              </span>
            </li>
          </ul>
          <p v-else class="status-copy">{{ $t('workflowWarehouse.shippingConfirmNoValidations') }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else-if="isFailure" class="status-block is-failure">
      <p class="status-title">{{ $t('workflowWarehouse.shippingConfirmNeedsReview') }}</p>

      <div v-if="issues.length" class="issues-block">
        <h4 class="issues-title">{{ $t('workflowWarehouse.shippingConfirmIssuesTitle') }}</h4>
        <ul class="issues-list">
          <li v-for="(item, index) in issues" :key="index" class="issue-item" :class="{ 'is-missing': isMissingIssue(item) }">
            <div class="issue-item__head">
              <el-tag size="small" effect="light" :type="isMissingIssue(item) ? 'warning' : 'danger'" class="issue-item__tag">
                {{ item.status || $t('workflowWarehouse.shippingConfirmUnknownStatus') }}
              </el-tag>
              <span class="issue-item__title">{{ resolveIssueTitle(item) }}</span>
            </div>
            <p v-if="item.message" class="issue-item__message">{{ item.message }}</p>
            <div v-if="shouldShowIssueValue(item)" class="issue-item__values">
              <span v-if="formatValue(item.source_value)" class="issue-item__value">
                {{ $t('workflowWarehouse.shippingConfirmSourceValue') }}: {{ formatValue(item.source_value) }}
              </span>
              <span v-if="formatValue(item.ocr_value)" class="issue-item__value">
                {{ $t('workflowWarehouse.shippingConfirmOcrValue') }}: {{ formatValue(item.ocr_value) }}
              </span>
            </div>
          </li>
        </ul>
      </div>
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

  &.is-processing,
  &.is-success {
    flex-wrap: wrap;
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

.status-success-copy {
  min-width: 0;
  flex: 1;
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

.validations-collapse {
  width: 100%;
  flex-basis: 100%;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  font-size: 0.875rem;

  &__status {
    flex-shrink: 0;
    min-width: 44px;
    text-align: center;
    padding: 1px 6px;
    border-radius: var(--app-border-radius-xs);
    font-size: 0.75rem;

    &.pass {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }

    &.diff,
    &.missing {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
  }

  &__label {
    color: var(--el-text-color-regular);
  }
}

.issues-block {
  margin-top: var(--app-space-s);
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--el-border-color-lighter);
}

.issues-title {
  margin: 0 0 var(--app-space-s);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-s);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);

  &.is-missing {
    border-color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  &__head {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    min-width: 0;
  }

  &__tag {
    flex-shrink: 0;
  }

  &__title {
    min-width: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--el-text-color-primary);
    word-break: break-word;
  }

  &__message {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--el-text-color-regular);
  }

  &__values {
    display: flex;
    flex-wrap: wrap;
    gap: var(--app-space-s);
  }

  &__value {
    font-size: 0.75rem;
    color: var(--el-text-color-secondary);
  }
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
