<script lang="ts" setup>
const props = defineProps<{
  isAdmin: boolean
}>()

const { database, updateDatabase, menuState } = useSingleDatabaseContext()
const routerProvider = inject(MenuRouterKey)

</script>

<template>
<div class="dbDashboardContainer">
    Dashboard
    {{menuState}}
</div>
</template>
