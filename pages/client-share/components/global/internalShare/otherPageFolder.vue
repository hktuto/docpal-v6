<script lang="ts" setup>
import { routeShareOtherPage } from "~/utils/routerHelper";
const props = defineProps<{ 
    idOrPath: string ,
    filter: any,
    title: string,
    homeId: string,
}>();

</script>
<template>
  <div class="pageContainer--padding">
    <BrowseTablePage :idOrPath="idOrPath" :home="{
      secondId: homeId,
      homeRouteItem: routeShareOtherPage({})
    }">
    </BrowseTablePage>
  </div>
</template>
<style lang="scss" scoped>
</style>
