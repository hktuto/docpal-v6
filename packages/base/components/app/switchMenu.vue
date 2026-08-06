<script lang="ts" setup>

const NODE_ENV = useRuntimeConfig().public.NODE_ENV
const appPlatform = useAppPlatform()
const isAdmin = useIsAdmin()
const isSuperAdmin = useIsSuperAdmin()

const showSwitchMenu = computed(() => {
  return isAdmin.value || isSuperAdmin.value || NODE_ENV === 'development' 
})

function switchPlatform(platform: string) {
  const path = platform === 'admin' ? '/admin' : '/'
  useRouter().push(path)
}

</script>

<template>
 <div v-if="showSwitchMenu">
   <template v-if="appPlatform === 'admin'">
     <div class="switchBtn" @click="switchPlatform('client')">Switch to Client Side</div>
   </template>
   <template v-else>
    <div class="switchBtn" @click="switchPlatform('admin')">Switch to Admin Side</div>
   </template>
 </div>
</template>

<style scoped lang="scss">
.switchBtn {
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-s);;
  font-size: var(--app-font-size-s);
  background-color: var(--app-grey-800);
  color: var(--app-grey-200);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    background-color: var(--app-primary-color);
    padding-left: var(--app-space-m);
  }
}
</style>
