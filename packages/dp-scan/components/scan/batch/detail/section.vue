<script lang="ts" setup>
import { useBatchDetailContext } from '#imports'

const props = defineProps<{
  section: any
}>()

const context = useBatchDetailContext()
if (!context) {
  throw new Error('BatchDetailContext not found')
}

// Destructure for easier access
const { highlightedSection, highlightedField, selectSection, selectField } = context

// Check if this section is currently highlighted
const isHighlighted = computed(() => {
  if (!highlightedSection.value || !props.section.zone) return false
  // Compare by section zone since that's what we use for highlighting
  return highlightedSection.value.zone === props.section.zone.zone
})

// Check if a field is highlighted
function isFieldHighlighted(field: any) {
  if (!highlightedField.value) return false
  return highlightedField.value.zone === field.zone.zone
}

// Handle mouse enter/leave for section
function handleSectionMouseEnter() {
  selectSection(props.section)
}

function handleSectionMouseLeave() {
  selectSection(null)
}

// Handle field mouse enter/leave
function handleFieldMouseEnter(field: any) {
  selectField(field)
}

function handleFieldMouseLeave() {
  selectField(null)
}

// Handle focus
function handleSectionFocus() {
  selectSection(props.section)
}

function handleFieldFocus(field: any) {
  selectField(field)
}
</script>

<template>
  <div
    class="sectionContainer"
    :class="{ highlighted: isHighlighted }"
    tabindex="0"
    @mouseenter="handleSectionMouseEnter"
    @mouseleave="handleSectionMouseLeave"
    @focus="handleSectionFocus"
  >
    <div class="sectionHeader">
      <Icon name="lucide:layout-template" class="sectionIcon" />
      <span class="sectionName">{{ section.section_name }}</span>
      <ElTag v-if="section.page" size="small" type="info">Page {{ section.page }}</ElTag>
    </div>

    <div v-if="section.fields?.length" class="fieldsList">
      <div
        v-for="field in section.fields"
        :key="field.field_id"
        class="fieldItem"
        :class="{ highlighted: isFieldHighlighted(field) }"
        tabindex="0"
        @mouseenter="handleFieldMouseEnter(field)"
        @mouseleave="handleFieldMouseLeave"
        @focus="handleFieldFocus(field)"
      >
        <Icon name="lucide:text" class="fieldIcon" />
        <span class="fieldName">{{ field.field_name }}</span>
        <ElTag v-if="field.field_type" size="small" type="info" effect="plain">
          {{ field.field_type }}
        </ElTag>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sectionContainer {
  width: 100%;
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-m);
  overflow: hidden;
  background-color: var(--app-bg-color);
  transition: all 0.2s ease;

  &:hover,
  &.highlighted {
    border-color: var(--app-primary-color);
    box-shadow: 0 0 0 1px var(--app-primary-color-light);
  }

  &:focus-within {
    outline: 2px solid var(--app-primary-color);
    outline-offset: 2px;
  }
}

.sectionHeader {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s) var(--app-space-m);
  background-color: var(--app-bg-color-secondary);
  border-bottom: 1px solid var(--app-border-color);
  font-weight: 600;
  font-size: var(--app-font-size-m);

  .sectionContainer:hover &,
  .sectionContainer.highlighted & {
    background-color: var(--app-primary-color-light);
    color: var(--app-primary-color);
  }
}

.sectionIcon {
  font-size: 16px;
}

.sectionName {
  flex: 1;
}

.fieldsList {
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-xs);
}

.fieldItem {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  border-radius: var(--app-radius-s);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover,
  &.highlighted {
    background-color: var(--app-primary-color-light);
    color: var(--app-primary-color);
  }

  &:focus {
    outline: 1px solid var(--app-primary-color);
    outline-offset: 1px;
  }
}

.fieldIcon {
  font-size: 14px;
  opacity: 0.7;
}

.fieldName {
  flex: 1;
  font-size: var(--app-font-size-s);
}
</style>
