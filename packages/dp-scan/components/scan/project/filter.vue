<script lang="ts" setup>
const filter = useAdminListFilter()
</script>

<template>
  <div class="filterListContaner">
    <ElInput v-model="filter.name" placeholder="Search by name" />
    <ElSelect v-model="filter.statusList" clearable multiple>
      <ElOption value="A" label="Active">Active</ElOption>
      <ElOption value="I" label="Inactive">Inactive</ElOption>
    </ElSelect>
  </div>
</template>

<style lang="scss" scoped>
.filterListContaner {
  display: flex;
  gap: var(--app-space-s);
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
