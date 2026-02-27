<script lang="ts" setup>
import { deepCopy } from "#imports"
import { newAdminApi } from 'api'
const state = reactive<any>({
  loading: false,
  list: [],
  _list: []
})
async function getList () {
  try {
    state.loading = true
    const res = await newAdminApi.getDocpalWorkflowProcessGetprocessdefinitionlist().then(res => res.data)
    res.forEach(item => {
      item.userTasks.push({ id:'complete', name: 'complete' })
    })
    state.list = res
    state._list = deepCopy(state.list)
  } catch (error) {
      console.log(error)
  } finally {
      state.loading = false
  }
}
onMounted(() => {
    getList()
})
</script>
<template>
<div class="pageContainer--padding workflowCardContainer">
  <template v-for="(item,index) in state._list" :key="index">
      <WorkflowFormCard :data="item"  />
  </template>
</div>
</template>

<style lang="scss" scoped>
.workflowCardContainer {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--app-space-xs);
  overflow: auto;
}
</style>