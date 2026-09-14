<template>
  <div class="pageContainer">
    <UserTable />
  </div>
</template>
<script lang="ts" setup>
import { gatewayApi } from 'api'
onMounted(async () => {
  const res: any = await gatewayApi.users.getUsersStats()
  console.log(res)
})
</script>
<style lang="scss" scoped>
.pageContainer {
  padding: var(--app-space-s);
  height: 100%;
  overflow: hidden;
}
</style>
