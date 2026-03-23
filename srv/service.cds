using { estudos_buildcode_java_1_cds as my } from '../db/schema.cds';

@path: '/service/estudos_buildcode_java_1_cds'
@requires: 'any'
service estudos_buildcode_java_1_cdsSrv {
  entity Customers as projection on my.Customers;
  entity Products as projection on my.Products;
  entity Purchases as projection on my.Purchases;
  entity Redemptions as projection on my.Redemptions;
}