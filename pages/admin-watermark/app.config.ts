// create nuxt app config
export default defineAppConfig({
  menu:{
    "admin-watermark":{
      id:"admin-watermark",
      name: 'admin-watermark',
      label: "adminMenu.watermark",
      icon: "lucide:file-image",
      hoverIcon: "lucide:file-image",
      component: "LazyWatermark",
      feature: "WATERMARK",
      props:{
        id:""
      },
    },
  }
})