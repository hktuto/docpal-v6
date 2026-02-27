export default defineAppConfig({
    menu:{
        "client-workflow":{
            id: 'client-workflow',
            name: 'client-workflow',
            icon: 'dp-icon:flow-outline',
            hoverIcon: 'dp-icon:flow-outline',
            label: "menus_workflow",
            component: "LazyWorkflowPage",
            feature: "WORKFLOW",
            props:{
                pageSize:20,
                pageNum: 0,

            }
        }
    }
})