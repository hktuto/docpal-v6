<script lang="ts" setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { DocTemplateProveKey } from '../../utils/docTemplateHelper'
import { type TipTapOptions } from 'docpal-document-editor/src/types'
import { normalizeTipTapOptions, clientEditorExtensions } from 'docpal-document-editor/src/client'

const props = defineProps<{
  options: TipTapOptions
  json?: any
}>()

const editor = ref()

function initEditor(initOptions: TipTapOptions, json?: any) {
  if (editor.value) {
    editor.value.destroy()
  }
  const normalizeOption = normalizeTipTapOptions(initOptions)
  const extensions = clientEditorExtensions(normalizeOption)

  editor.value = new Editor({
    content: json,
    autofocus: true,
    extensions: [...extensions],
    editable: false
  })
}

onMounted(() => {
  if (props.options) {
    initEditor(props.options, props.json)
  }
})

watch(
  props.json,
  (newVal) => {
    if (newVal) {
      const options = props.options ? props.options : {}
      initEditor(options, newVal)
    }
  },
  {
    deep: true
  }
)
onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

provide(DocTemplateProveKey, {
  editor
})

defineExpose({ initEditor })
</script>

<template>
  <div
    class="editorContainer"
    :style="`--margin-top: ${props.options.pageSetting?.defaultMarginConfig?.top}mm; --margin-bottom: ${props.options.pageSetting?.defaultMarginConfig?.bottom}mm; --margin-left: ${props.options.pageSetting?.defaultMarginConfig?.left}mm; --margin-right: ${props.options.pageSetting?.defaultMarginConfig?.right}mm;`"
  >
    <div class="editorBody">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editorContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editorBody {
  flex: 1;
  padding: var(--app-space-m);
  min-height: 0;
  overflow: auto;

  :deep(.tiptap) {
    outline: none;
    min-height: 100%;
  }
}
</style>

<style>
.tiptap {
  :first-child {
    margin-top: 0;
  }
  li {
    &::marker {
      font-size: 12px;
    }
  }
  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td,
    th {
      /* border: 1px solid var(--app-grey-900); */
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      /* background-color: var(--app-grey-800); */
      font-weight: bold;
      text-align: left;
    }
  }

  [data-type='taskList'] {
    list-style: none;
    padding-inline-start: 0;

    li {
      > * {
        display: inline-block;
      }
    }
  }

  .page {
    --border-color: #888;
    page-break-after: always;
    page-break-inside: avoid;
    break-after: page;
    break-inside: avoid;
    background: white;
    box-sizing: border-box;
    position: relative;
    overflow: visible;

    &:last-child {
      page-break-after: auto;
      break-after: auto;
      margin-bottom: 0;
    }

    &:before {
      content: '';
      width: 20px;
      height: 20px;
      position: absolute;
      top: calc(var(--margin-top) - 20px);
      right: calc(var(--margin-right) - 20px);
      display: block;
      border-bottom: 1px solid var(--border-color);
      border-left: 1px solid var(--border-color);
    }

    &:after {
      content: '';
      width: 20px;
      height: 20px;
      position: absolute;
      bottom: calc(var(--margin-bottom) - 20px);
      right: calc(var(--margin-right) - 20px);
      display: block;
      border-top: 1px solid var(--border-color);
      border-left: 1px solid var(--border-color);
    }
  }

  .body {
    position: relative;
    overflow: visible !important;
    page-break-inside: avoid;
    break-inside: avoid;

    &:before {
      content: '';
      width: 20px;
      height: 20px;
      position: absolute;
      top: -20px;
      left: -20px;
      display: block;
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
    }

    &:after {
      content: '';
      width: 20px;
      height: 20px;
      position: absolute;
      bottom: -20px;
      left: -20px;
      display: block;
      border-top: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
    }
  }

  /* 确保段落和块级元素不会在页面中间断开 */

  p,
  div,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  blockquote,
  pre,
  table {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  p {
    margin-block: 0.5rem;
  }
  /* 允许标题在页面顶部断开 */

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* 确保表格不会在页面中间断开 */

  table {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* 图片和媒体元素的分页控制 */

  img,
  video,
  canvas {
    page-break-inside: avoid;
    break-inside: avoid;
    max-width: 100%;
    height: auto;
  }

  /* 列表的分页控制 */

  ul,
  ol {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  li {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
</style>
