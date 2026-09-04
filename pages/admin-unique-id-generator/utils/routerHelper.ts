export const routeUniqueIdGeneratorDetail = function (params: any) {
  return {
    id: 'unique-id-generator-detail',
    name: 'unique-id-generator-detail',
    icon: 'dp-icon:flow-outline',
    label: params.name,
    component: 'LazyUniqueIdGeneratorDetail',
    props: {
      id: params.id
    }
  } as TabItem
}
