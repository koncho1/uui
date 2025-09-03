sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], (UIComponent, JSONModel) => {
	"use strict";

	return UIComponent.extend("ui5.walkthrough.Component", {
		metadata: {
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
			manifest: "json"
		},

		init() {
			// call parent init
			UIComponent.prototype.init.apply(this, arguments);

			// optional: log the nodeModel (will be undefined if OData 401 occurs)
			const oModel = this.getModel("nodeModel");
			console.log(oModel);
		}
	});
});
