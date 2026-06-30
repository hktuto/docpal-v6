<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import { ColumnFieldType } from '../../../types/column-types'
import AttachmentFieldWidget from './attachment.vue'
import DateTimeFieldWidget from './dateTime.vue'
import DefaultFieldWidget from './default.vue'
import DocPalDocFieldWidget from './docPalDoc.vue'
import SystemUserFieldWidget from './systemUser.vue'
import UrlFieldWidget from './url.vue'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const fieldWidget = computed(() => getFieldWidget(props.field?.business_type))

function getFieldWidget(fieldType: unknown): Component {
  switch (fieldType) {
    case ColumnFieldType.URL:
      return UrlFieldWidget
    case ColumnFieldType.DocPalDoc:
      return DocPalDocFieldWidget
    case ColumnFieldType.DateTime:
    case ColumnFieldType.CreatedTime:
    case ColumnFieldType.LastModifiedTime:
      return DateTimeFieldWidget
    case ColumnFieldType.CreatedBy:
    case ColumnFieldType.LastModifiedBy:
      return SystemUserFieldWidget
    case ColumnFieldType.Attachment:
      return AttachmentFieldWidget
    default:
      return DefaultFieldWidget
  }
}
</script>

<template>
  <component :is="fieldWidget" :row="row" :field="field" />
</template>
