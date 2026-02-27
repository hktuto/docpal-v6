<script lang="ts" setup>
const props = defineProps<{
  id: string
  expandedItems: any[]
}>()

const routerProvider = inject(MenuRouterKey)

function idChange(id: string) {
  routerProvider?.updateProps({
    id: id || 'root'
  })
}

function expandedItemsChange(expandedItems: any[]) {
  routerProvider?.updateProps({
    expandedItems
  })
}
</script>

<template>
    <div class="pageContainer">
      <ResourceDocumentTable 
        :id="id" 
        :expandedItems="expandedItems || []" 
        @idChange="idChange" 
        @expandedItemsChange="expandedItemsChange" 
      />
    </div>
</template>

<style lang="scss" scoped>
.pageContainer{
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
}
</style>
