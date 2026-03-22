namespace estudos_buildcode_java_1_cds;
using { cuid } from '@sap/cds/common';

@assert.unique: { customerNumber: [customerNumber] }
entity Customers : cuid {
  name: String(100);
  email: String(100);
  customerNumber: Integer @mandatory;
  totalPurchaseValue: Integer;
  totalRewardPoints: Integer;
  totalRedeemedRewardPoints: Integer;
  purchases: Association to many Purchases on purchases.customer = $self;
  redemptions: Association to many Redemptions on redemptions.customer = $self;
}

@assert.unique: { name: [name] }
entity Products : cuid {
  name: String(100) @mandatory;
  description: String(500);
  price: Integer;
}

entity Purchases : cuid {
  purchaseValue: Integer;
  rewardPoints: Integer;
  customer: Association to Customers;
  selectedProduct: Association to Products;
}

entity Redemptions : cuid {
  redeemedAmount: Integer;
  customer: Association to Customers;
}

