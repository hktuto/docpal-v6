## 供应商来料管理 Supplier Incoming Material Management
来料清单上传录入（OCR）
来料清单校验与核对(OCR)
Incoming List Upload & Entry (OCR)
*Incoming List Verification and Checking (OCR)


1. 单据主表（新系统标准表）
SUPPLY_LIST 供应商来料清单主表
RECEIVE_ORDER 实物收货单主表
QC_INSPECT_ORDER 验货单主表
SHIP_LIST 出货明细清单主表
SHIP_ORDER 实物出货单主表
2. 明细行表（一对多，物料明细）
后缀加_DETAIL：SUPPLY_LIST_DETAIL、RECEIVE_ORDER_DETAIL 等
3. 异常流程记录表
QC_DEFECT_RECORD 不良品记录
RECEIVE_SHORT_OVER 短溢收记录
SHIP_RETURN_RECORD 出货退货记录
4. 数据迁移中间表（新旧系统过渡专用，不影响业务）
OLD_DATA_MAPPING 新旧单据 ID 映射表
DATA_MIGRATE_CHECK 迁移数据校验记录表
5. 库存台账表（联动收、验、出货自动更新）
INVENTORY_STOCK 实时库存
INVENTORY_HISTORY 10 年库存变动流水（年度分区）
