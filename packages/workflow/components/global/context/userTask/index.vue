<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { createError } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
</script>

<template>
  <div class="fromContainer">
    <section class="property-section">
      <div class="section-title">Basic</div>
      <SidebarLabel :node="node" />
    </section>

    <section class="property-section">
      <div class="section-title">Assignee</div>
      <ContextUserTaskAssignee :node="node" />
    </section>

    <section class="property-section">
      <div class="section-title">Schedule</div>
      <ContextUserTaskAdditional :node="node" />
    </section>

    <section class="property-section">
      <div class="section-title">Form</div>
      <ContextForm :node="node" />
    </section>

    <section class="property-section">
      <div class="section-title">Buttons</div>
      <ContextUserTaskBooleanButton :node="node" />
    </section>
  </div>
</template>

<style lang="scss" scoped>
.fromContainer {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.property-section {
  padding-top: var(--app-space-s);
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.section-title {
  margin-bottom: var(--app-space-m);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.property-section :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.property-section :deep(.el-divider) {
  display: none;
}
</style>
