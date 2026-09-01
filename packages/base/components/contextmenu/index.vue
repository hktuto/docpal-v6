<script lang="ts" setup>
import { useEventBus, EventType } from 'eventbus'
// import { useEventBus, EventType } from '#imports'



const actions = ref<TableMenuActions[][]>([])
const visible = ref(false)
const rowData = ref<any>() 
const position = ref<any>({x:0, y:0, left:0, top:0})
const menuItemHeight = 26;
const contextmenuRef = ref<HTMLElement>()

onClickOutside(contextmenuRef, () => {
    contextMenuCloseHandler()
})

const contextMenuOpenHandler = (args:TABLE_CONTEXT_PARAMS)=>{
    const x = args.event?.clientX ?? 0
    const y = args.event?.clientY ?? 0
    actions.value = args.options
    rowData.value = args.row
    position.value = { x, y, left: x, top: y }
    visible.value = true
    nextTick(() => {
        const el = contextmenuRef.value
        const rect = el?.getBoundingClientRect()
        const width = rect?.width || 0
        const height = rect?.height || getRootActionMaxHeight(actions.value, menuItemHeight)
        const left = x + width > window.innerWidth ? x - width : x
        const top = y + height > window.innerHeight ? y - height : y
        position.value = { x, y, left, top }
    })
}

const contextMenuCloseHandler = () => {
    rowData.value = undefined
    actions.value = []
    visible.value = false
}


const displayActions = computed(() => actions.value.filter(item => item.some(i => i.visible !== false)))


const contextMenuBus = useEventBus<TABLE_CONTEXT_PARAMS>(EventType.TABLE_CONTEXT_MENU_OPEN)
const contextMenuCloseBus = useEventBus<void>(EventType.TABLE_CONTEXT_MENU_CLOSE)
contextMenuBus.on(contextMenuOpenHandler)
contextMenuCloseBus.on(contextMenuCloseHandler)
onUnmounted(() => {
    contextMenuBus.off(contextMenuOpenHandler)
    contextMenuCloseBus.off(contextMenuCloseHandler)
})
</script>

<template>
    <div
      ref="contextmenuRef"
      class="vxe-table--ignore-clear contextMenuContainer"
      :class="{ visible }"
      :style="{ left: position.left + 'px', top: position.top + 'px', ['--context-item-height']: menuItemHeight + 'px' }"
    >
        <ContextmenuList v-for="(action, index) in displayActions" :key="index" :items="action" :menuItemHeight="menuItemHeight" :rowData="rowData" />
    </div>
</template>
