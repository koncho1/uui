sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v4/ODataModel"
], (UIComponent, JSONModel, ODataModel) => {
	"use strict";

	return UIComponent.extend("ui5.walkthrough.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init() {
			// call parent init
			UIComponent.prototype.init.apply(this, arguments);

			const oNodeModel = new ODataModel({
                serviceUrl: "/sap/opu/odata4/sap/zkc_node_ui_v4/srvd_a2x/sap/zkc_node_ui/0001/",
                synchronizationMode: "None"
            });
			 this.setModel(oNodeModel, "nodeModel");



		}
	});
});
