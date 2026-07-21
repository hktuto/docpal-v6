// Supplier Goods List Attachment
export const SGLA_TABLE_ID = 'fe424e50-738c-11f1-93f8-b1266e822267'
export enum SGLA {
  Name = 'f_4859_728f9a28',
  BatchId = 'f_4855_8f7fd4bb',
  Status = 'f_4862_4bf7a406',
  VendorName = 'f_4857_e65e6089',
  CustomerName = 'f_4858_a4fc10f8',
  DeliveryDate = 'f_5004_5c950eef',
  Total_Ctn = 'f_4880_652c59cd'
}

// Supplier Goods List Attachment Items
export const SGLA_ITEMS_TABLE_ID = '2812f4f0-738d-11f1-93f8-b1266e822267'
export enum SGLAItems {
  MasterId = 'f_4856_72615eaf',
  // TODO: replace with real field ids from dynamic DB
  Carton = 'f_4864_c572140f',
  KoaCode = 'f_4865_208a1162',
  CustomerPn = 'f_4866_f009e86d', // wcl_item_no
  Qty = 'f_4869_e60ac31e',
  PoLine = 'f_4863_76fdba60',
  Checked = 'f_5481_4365d92c'
}
