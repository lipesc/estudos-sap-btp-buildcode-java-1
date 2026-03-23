sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.estudos.buildcode.java1.ui.controller.Main", {
    _serviceBase: "/odata/v4/service/estudos_buildcode_java_1_cds",

    onInit: function () {
      this._authHeaders = {
        Authorization: "Basic YXV0aGVudGljYXRlZDo="
      };

      this.getView().setModel(new JSONModel({ items: [] }), "customers");
      this.getView().setModel(new JSONModel({ items: [] }), "products");
      this.getView().setModel(new JSONModel({ items: [] }), "purchases");

      this._loadCustomers();
      this._loadProducts();
      this.byId("purchaseValueInput").attachLiveChange(this._onPurchaseValueChange.bind(this));
    },

    _loadCustomers: async function () {
      const aItems = await this._readEntityWithFallback("Customers");
      this.getView().getModel("customers").setProperty("/items", aItems);
    },

    _loadProducts: async function () {
      const aItems = await this._readEntityWithFallback("Products");
      this.getView().getModel("products").setProperty("/items", aItems);
    },

    _loadPurchases: async function () {
      const sFilter = this.byId("customerFilterInput").getValue().trim();
      const aItems = await this._readEntityWithFallback("Purchases", "$expand=customer,selectedProduct");

      let aMapped = aItems.map(function (oItem) {
        return {
          ID: oItem.ID,
          purchaseValue: oItem.purchaseValue,
          rewardPoints: oItem.rewardPoints,
          customerId: oItem.customer_ID,
          customerNumber: oItem.customer?.customerNumber || "",
          productId: oItem.selectedProduct_ID,
          customerName: oItem.customer?.name || oItem.customer_ID || "",
          productName: oItem.selectedProduct?.name || oItem.selectedProduct_ID || ""
        };
      });

      if (sFilter) {
        aMapped = aMapped.filter(function (oItem) {
          return String(oItem.customerNumber || "").includes(sFilter);
        });
      }

      this.getView().getModel("purchases").setProperty("/items", aMapped);
    },

    _readEntityWithFallback: async function (sEntitySet, sQuery) {
      const aUrls = [
        `${this._serviceBase}/${sEntitySet}?$filter=IsActiveEntity%20eq%20true${sQuery ? `&${sQuery}` : ""}`,
        `${this._serviceBase}/${sEntitySet}${sQuery ? `?${sQuery}` : ""}`
      ];

      for (const sUrl of aUrls) {
        try {
          const oResponse = await fetch(sUrl, { headers: this._authHeaders });
          if (!oResponse.ok) {
            continue;
          }

          const oData = await oResponse.json();
          return Array.isArray(oData.value) ? oData.value : [];
        } catch (e) {
          // Continue to fallback URL.
        }
      }

      return [];
    },

    onOpenPurchases: function () {
      this.byId("appNav").to(this.byId("purchasesPage"));
    },

    onOpenCustomers: function () {
      this.byId("appNav").to(this.byId("customersPage"));
    },

    onOpenRedemptions: function () {
      MessageToast.show("Redemptions page can be added next.");
    },

    onGoPurchases: function () {
      this._loadPurchases();
    },

    onCreatePurchase: function () {
      this.byId("purchaseValueInput").setValue("");
      this.byId("rewardPointsInput").setValue("");
      this.byId("customerSelect").setSelectedKey("");
      this.byId("productSelect").setSelectedKey("");
      this.byId("appNav").to(this.byId("createPurchasePage"));
    },

    _onPurchaseValueChange: function (oEvent) {
      const nValue = Number(oEvent.getParameter("value") || 0);
      const nPoints = Number.isFinite(nValue) ? (nValue * 0.1) : 0;
      this.byId("rewardPointsInput").setValue(nPoints.toFixed(2));
    },

    onSavePurchase: async function () {
      const sPurchaseValue = this.byId("purchaseValueInput").getValue();
      const sCustomerId = this.byId("customerSelect").getSelectedKey();
      const sProductId = this.byId("productSelect").getSelectedKey();

      if (!sPurchaseValue || !sCustomerId || !sProductId) {
        MessageToast.show("Please fill Purchase Value, Customer, and Selected Product.");
        return;
      }

      const nPurchaseValue = Number(sPurchaseValue);
      const nRewardPoints = Number((nPurchaseValue * 0.1).toFixed(2));
      const aCustomers = this.getView().getModel("customers").getProperty("/items") || [];
      const oCurrentCustomer = aCustomers.find(function (oCustomer) {
        return oCustomer.ID === sCustomerId;
      });

      const oPayload = {
        purchaseValue: nPurchaseValue,
        rewardPoints: nRewardPoints,
        customer_ID: sCustomerId,
        selectedProduct_ID: sProductId
      };

      try {
        const oCreateResponse = await fetch(`${this._serviceBase}/Purchases`, {
          method: "POST",
          headers: {
            ...this._authHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(oPayload)
        });

        if (!oCreateResponse.ok) {
          MessageToast.show(`Create failed (${oCreateResponse.status}).`);
          return;
        }

        if (oCurrentCustomer) {
          const nCurrentPurchaseValue = Number(oCurrentCustomer.totalPurchaseValue || 0);
          const nCurrentRewardPoints = Number(oCurrentCustomer.totalRewardPoints || 0);

          const oCustomerPatch = {
            totalPurchaseValue: Number((nCurrentPurchaseValue + nPurchaseValue).toFixed(2)),
            totalRewardPoints: Number((nCurrentRewardPoints + nRewardPoints).toFixed(2))
          };

          await fetch(`${this._serviceBase}/Customers(${sCustomerId})`, {
            method: "PATCH",
            headers: {
              ...this._authHeaders,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(oCustomerPatch)
          });
        }
      } catch (e) {
        MessageToast.show("Create failed. Please try again.");
        return;
      }

      await this._loadPurchases();
      await this._loadCustomers();
      MessageToast.show("Purchase created.");
      this.byId("appNav").to(this.byId("purchasesPage"));
    },

    onShellNavChange: function (oEvent) {
      const sKey = oEvent.getParameter("selectedItem").getKey();
      const oNav = this.byId("appNav");

      if (sKey === "home") {
        oNav.to(this.byId("homePage"));
      } else if (sKey === "purchases") {
        oNav.to(this.byId("purchasesPage"));
      } else if (sKey === "customers") {
        oNav.to(this.byId("customersPage"));
      } else if (sKey === "redemptions") {
        MessageToast.show("Redemptions page can be added next.");
      }
    }
  });
});
