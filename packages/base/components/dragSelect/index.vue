<template>
  <div :class="`drag-select--${layout}`">
    <template v-if="dragList.length === 0">
      <div class="tip">
        {{ $t(nullTip) }}
      </div>
    </template>
    <template v-else-if="showDragTip">
      <div class="tip">
        {{ $t('exportDialog.tip') }}
      </div>
    </template>
    <draggable class="list-drag" :list="dragList" group="people" :itemKey="itemKey">
      <template #item="{ element, index }">
        <el-tag class="list-drag-item" >
          {{ $t(`${element[itemLabel] ? element[itemLabel] : element[itemKey]}`) }}
        </el-tag>
      </template>
    </draggable>
    <div class="list-arrow">
      <el-icon :size="20" aria-hidden="true">
        <SwitchIcon v-if="layout === 'lr'" />
        <Sort v-else />
      </el-icon>
    </div>
    <draggable class="list-drop" :list="dropList" group="people" :itemKey="itemKey" handle=".canDrag" @change="() => emit('change', { dropList, dragList })">
      <template #item="{ element, index }">
        <span class="list-drop-item">
          <!-- <span v-if="element.prefixSymbol" class="list-drop-item--divider" >{{element.prefixSymbol}}</span> -->
          <!-- <DragSelectTag :element="element" @close="handleClose"/> -->
          <!-- <span v-if="element.suffixSymbol" class="list-drop-item--divider">{{element.suffixSymbol}}</span> -->
          <el-tag ref="tagRef" :class="{ 'el-tag-normal': !element.noDelete, 'el-tag-drop': true }" :closable="!element.noDelete"  :title="element[itemKey]" @close="handleClose(element)">
            <el-icon v-if="!element.noDelete" class="canDrag"><Rank /></el-icon>
            {{ element.title ? element.title : $t(`${element[itemLabel] ? element[itemLabel] : element[itemKey]}`) }}
            <slot name="buttons" :element="element" :index="index" />
          </el-tag>
          <span class="list-drop-item--divider">{{ joiner }}</span>
        </span>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { Rank, Sort, Switch as SwitchIcon } from '@element-plus/icons-vue'
const props = withDefaults(
  defineProps<{
    dropList: any
    dragList: any
    joiner: string
    itemKey: string
    itemLabel: string
    nullTip: string
    showDragTip: boolean
    layout: 'tb' | 'lr'
  }>(),
  {
    joiner: '-',
    itemKey: 'metadata',
    itemLabel: 'name',
    nullTip: 'dpTip.noMore',
    showDragTip: false,
    layout: 'tb'
  }
)
const FormRendererRef = ref()
const emit = defineEmits(['change'])
function handleClose(element) {
  let addItem
  const index = props.dropList.findIndex((item) => {
    if (item[props.itemKey] === element[props.itemKey]) {
      addItem = element
      return true
    } else return false
  })
  props.dropList.splice(index, 1)
  props.dragList.push(addItem)
  emit('change', { dropList: props.dropList, dragList: props.dragList })
}
function handleChange(evt) {
  const dropLen = props.dropList.length
  if (evt.added) {
    if (evt.added.newIndex < dropLen - 1) {
      const newEl = props.dropList[evt.added.newIndex]
      newEl.suffixSymbol = '-'
    } else if (evt.added.newIndex === dropLen - 1 && dropLen > 1) {
      const previousEl = props.dropList[evt.added.newIndex - 1]
      previousEl.suffixSymbol = '-'
    }
  } else if (evt.removed) {
    if (evt.removed.oldIndex === dropLen) {
      const lastEl = props.dropList[dropLen - 1]
      if (lastEl.suffixSymbol === '-') lastEl.suffixSymbol = ''
    }
  }
  emit('change')
}
onMounted(() => {})
</script>
<style lang="scss" scoped>
.drag-select--tb {
  .list-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: var(--app-space-xs) 0;
    color: var(--el-text-color-secondary);
  }
  .list-drag {
    &-item {
      margin-right: 3px;
      margin-bottom: 3px;
    }
  }
  .list-drop {
    min-height: 32px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 3px 0px 3px 11px;
    &-item {
      &--divider {
        margin: 0 3px;
      }
      &:last-of-type &--divider {
        display: none;
      }
    }
  }
  .el-tag-normal {
    padding-left: 0;
    :deep(.el-tag__content) {
      display: flex;
      align-items: center;
      line-height: 22px;
    }
  }
}
.drag-select--lr {
  display: grid;
  height: 100%;
  overflow: hidden;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: 1fr min-content;
  grid-column-gap: var(--app-space-xs);
  .list-arrow {
    grid-area: 1 / 2 / 2 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--el-text-color-secondary);
  }
  .list-drop {
    border: 1px solid #ddd;
    padding: var(--app-space-xs);
    overflow: auto;
    grid-area: 1 / 1 / 2 / 2;
    .el-tag {
      display: flex;
      align-items: center;
      width: fit-content;
      :deep(.el-tag__content) {
        display: flex;
        align-items: center;
      }
    }
    .el-tag-drop {
      padding-left: 0;
      text-align: center;
    }
    .list-drop-item {
      display: block;
      margin-bottom: var(--app-space-xs);
    }
  }
  .list-drag {
    border: 1px solid #ddd;
    padding: var(--app-space-xs);
    overflow: auto;
    grid-area: 1 / 3 / 2 / 4;
    .el-tag {
      display: block;
      width: fit-content;
      text-align: center;
      line-height: 22px;
    }
    .list-drag-item {
      margin-bottom: var(--app-space-xs);
    }
  }
  .tip {
    grid-area: 2 / 1 / 3 / 4;
  }
}
.list-drag-item,
.canDrag {
  cursor: move;
}
</style>
