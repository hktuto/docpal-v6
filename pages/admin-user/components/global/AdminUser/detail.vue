<script lang="ts" setup>
import type { UserDTO } from 'api/src/generate/admin'

const { id } = defineProps<{
  id: string
}>()
const { fetchUserById } = useAdminUser()
const state = reactive<{
  curUser: UserDTO | null
}>({
  curUser: null
})
defineOptions({
  name: 'AdminUserDetailDead'
})

async function getUser() {
  const data: any = await fetchUserById(id)
  if (!data) return
  data.status = data.status === 'A' ? 'A' : 'D'
  state.curUser = data
}

onMounted(() => {
  getUser()
})
</script>
<template>
  <div class="userDetailSection" v-if="state.curUser">
    <UserInfo class="info" :user="state.curUser" @refresh="getUser"></UserInfo>
    <UserGroupTable class="group" :user="state.curUser">group</UserGroupTable>
  </div>
</template>
<style lang="scss" scoped>
.userDetailSection {
  height: 100%;
  padding: var(--app-space-s);
  display: grid;
  grid-template-columns: minmax(min-content, 400px) 1fr;
  grid-template-rows: 1fr;
  gap: var(--app-space-xs);
  grid-template-areas:
    'list topArea topArea'
    'list group virtualFolder';
  height: 100%;
  overflow: hidden;

  :deep(.el-card) {
    height: 100%;
    overflow: hidden;
  }

  :deep(.el-card__header) {
    min-height: 45px !important;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;

    > * {
      width: 100%;
    }
  }
}
</style>
