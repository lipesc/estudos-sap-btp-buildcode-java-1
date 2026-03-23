namespace estudos_buildcode_java_1_cds;
using { cuid } from '@sap/cds/common';

@assert.unique: { customerNumber: [customerNumber] }
entity Customers : cuid {
  name: String(100);
  email: String(100);
  customerNumber: Integer @mandatory;
  totalPurchaseValue: Decimal(15,2);
  totalRewardPoints: Decimal(15,2);
  totalRedeemedRewardPoints: Decimal(15,2);
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
  purchaseValue: Decimal(15,2);
  rewardPoints: Decimal(15,2);
  customer: Association to Customers;
  selectedProduct: Association to Products;
}

entity Redemptions : cuid {
  redeemedAmount: Decimal(15,2);
  customer: Association to Customers;
}

