<script setup lang="ts">
import { VirtGrid } from 'vue-virt-list'

interface IconCategory {
  name: string
  key: string
  icons: string[]
  loaded: boolean
}

const loading = ref(false)
const iconCategories = ref<IconCategory[]>([
  { name: 'Lucide', key: 'lucide', icons: [], loaded: false },
  { name: 'Material', key: 'mdi', icons: [], loaded: false },
  { name: 'Ionicons', key: 'ion', icons: [], loaded: false },
  { name: 'Heroicons', key: 'heroicons', icons: [], loaded: false },
  { name: 'Tabler Icons', key: 'tabler', icons: [], loaded: false },
])

const selectedCategory = ref<IconCategory>(iconCategories.value[0])
const gridContainerRef = ref<HTMLElement>()

const emits = defineEmits(['selected'])

// Computed icons with full name prefix for Icon component
const displayIcons = computed(() => {
  return selectedCategory.value.icons.map(icon => `${selectedCategory.value.key}:${icon}`)
})

async function fetchCategoryIcons(category: IconCategory) {
  if (category.loaded) return
  
  loading.value = true
  try {
    const response = await fetch(`https://api.iconify.design/collection?prefix=${category.key}`)
    const data = await response.json()
    category.icons = data.uncategorized || []
    category.loaded = true
  } catch (error) {
    console.error(`Failed to fetch icons for ${category.key}:`, error)
    category.icons = []
  } finally {
    loading.value = false
  }
}

async function handleCategoryClick(category: IconCategory) {
  selectedCategory.value = category
  await fetchCategoryIcons(category)
}

function handleIconClick(icon: string) {
  emits('selected', icon)
}

onMounted(async () => {
  // Load the first category by default
  await fetchCategoryIcons(selectedCategory.value)
})
</script>

<template>
  <div class="iconSelector">
    <div class="categoryList" role="tablist">
      <div 
        v-for="category in iconCategories" 
        :key="category.key"
        :class="{ categoryItem: true, selected: selectedCategory.key === category.key }"
        tabindex="0"
        role="tab"
        :aria-selected="selectedCategory.key === category.key"
        :aria-label="`${category.name} icons`"
        @click="handleCategoryClick(category)"
        @keydown.enter="handleCategoryClick(category)"
        @keydown.space.prevent="handleCategoryClick(category)"
      >
        {{ category.name }}
        <el-badge v-if="selectedCategory.key === category.key" :value="displayIcons.length" />
      </div>
    </div>
    <div v-loading="loading" ref="gridContainerRef" class="iconListContainer">
      <VirtGrid
        v-if="displayIcons.length > 0"
        :list="displayIcons"
        :buffer="10"
        :itemPreSize="40"
        :gridItems="8"
      >
        <template #default="{ itemData }">
          <div 
            class="iconItem"
            tabindex="0"
            :aria-label="itemData"
            @click="handleIconClick(itemData)"
            @keydown.enter="handleIconClick(itemData)"
          >
            <Icon :name="itemData" />
          </div>
        </template>
      </VirtGrid>
      <div v-else-if="!loading" class="emptyState">
        No icons available
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.iconSelector {
  line-height: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);

  .categoryList {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-xs);
    overflow-x: auto;
    flex-shrink: 0;

    .categoryItem {
      cursor: pointer;
      padding: var(--app-space-xxs) var(--app-space-xs);
      border-radius: var(--app-border-radius-s);
      font-size: var(--app-font-size-m);
      white-space: nowrap;
      transition: background-color 0.2s ease, outline 0.15s ease;

      &:hover {
        background-color: var(--app-grey-850);
      }

      &.selected:not(:hover) {
        background-color: var(--app-primary-color);
      }

      &:focus {
        outline: 2px solid var(--app-primary-color);
        outline-offset: 2px;
      }

      &:focus:not(:focus-visible) {
        outline: none;
      }

      &:focus-visible {
        outline: 2px solid var(--app-primary-color);
        outline-offset: 2px;
      }
    }
  }

  .iconListContainer {
    width: 100%;
    height: 200px;
    position: relative;
    overflow: hidden;
  }

  .emptyState {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--app-text-color-secondary);
  }
}

.iconItem {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--app-text-color-secondary);
  &:hover {
    background-color: var(--app-grey-850);
  }

  &:focus {
    outline: 2px solid var(--app-primary-color);
    outline-offset: -2px;
  }
}
</style>
