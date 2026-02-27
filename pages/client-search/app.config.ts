export default defineAppConfig({
    menu:{
        "client-search":{
            id: 'client-search',
            name: 'client-search',
            icon: 'lucide:search',
            hoverIcon: 'lucide:search',
            label: "file_search",
            component: "LazySearchPage",
            feature: "SEARCH",
            props:{
                pageSize:20,
                pageNum: 0,

            }
        },
        "client-smartFolder": {
            id: 'client-smartFolder',
            name: 'client-smartFolder',
            icon: 'material-symbols:map-search-outline-rounded',
            hoverIcon: 'material-symbols:map-search-outline-rounded',
            label: "file_smartFolder",
            component: "LazySmartFolderPage",
            feature: "SMART_FOLDER",
            props:{
            }
        }
    }
})