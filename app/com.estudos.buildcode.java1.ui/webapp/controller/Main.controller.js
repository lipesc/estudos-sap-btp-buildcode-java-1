sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("com.estudos.buildcode.java1.ui.controller.Main", {
    onInit: async function () {
      const oModel = new JSONModel({ items: [] });
      this.getView().setModel(oModel, "customers");

      const aUrls = [
        "/service/estudos_buildcode_java_1_cds/Customers?$filter=IsActiveEntity%20eq%20true",
        "/service/estudos_buildcode_java_1_cds/Customers"
      ];

      for (const sUrl of aUrls) {
        try {
          const oResponse = await fetch(sUrl);
          if (!oResponse.ok) {
            continue;
          }

          const oData = await oResponse.json();
          const aItems = Array.isArray(oData.value) ? oData.value : [];

          if (aItems.length > 0 || sUrl === aUrls[aUrls.length - 1]) {
            oModel.setProperty("/items", aItems);
            break;
          }
        } catch (e) {
          // Continue to fallback URL if first call fails.
        }
      }
    }
  });
});
