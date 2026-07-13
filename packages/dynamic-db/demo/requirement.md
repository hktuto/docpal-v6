# Dyanmic Feature demo

## introduction
a new client has come and wnna do a demo. but some feature is not ready yet, so i want to create a demo to show what the final ui will look like. the main feature will be a dashboard.
i've some demo raw data in ./all.xlsx. and i want you to create widget for me in dynamic-db, then i can create page myself. no need to call api, some grouping and filter options is not avalible in backend yet. so do the ui in local data. the xlsx data is just for reference, you can create any flat data to let calculate easier, or add any missing field or relation.

## Dashboards

### Inventory Summary  

### Widgets

#### Total Inventory Report
use the Inventory table, group data by
- Brand
  - Parts (Wcl Parts)
    - Warehouse
      - Sub Inventory
        - Date Code


#### Warehouse Inbound/Outbound Report
use the transition table, to calculate, month in/out bound, and y axis is group by Warehouse, Brand and Parts

#### Upcoming Goods Arrival Report 
Group By,
- Warehouse
  - Brand
    - Delivery Date
      - PO
        - Parts

#### Aging Report 
use Inventory table and calcuate per 3 month age
x axis group by age with within 3, 3-6month, 6-9month, 9-12month, and on each item show unit(qty) and cost(look up from po)
y axis group by
- Brand
  - Parts
