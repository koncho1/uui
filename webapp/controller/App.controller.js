sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/HBox",
    "sap/ui/core/HTML",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/theming/Parameters"
], function (Controller, Button, VBox, Input, HBox, HTML, MessageBox, MessageToast, Parameters) {
    "use strict";

    return Controller.extend("ui5.walkthrough.controller.App", {

        onInit: async function () {

            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            // Fetch nodes from OData V4
// const oModel = this.getOwnerComponent().getModel("nodeModel");

// const oListBinding = oModel.bindList(
//     "/ZKC_CV_NODE",
//     undefined,
//     undefined,
//     undefined,
//     { $$groupId: "$direct" }
// );

// const edgeListBindng = oModel.bindList("/ZKC_CV_EDGE");

// const edgeContexts = await edgeListBindng.requestContexts();

// const aEdges = edgeContexts.map(ctx => ctx.getObject());

// var edges = [];

// aEdges.forEach((edge) => {
//     edges.push([edge.ZFrom - 1, edge.ZTo - 1]);
// });

// const aContexts = await oListBinding.requestContexts();

// if (!Array.isArray(aContexts) || aContexts.length === 0) {
//     console.error("No nodes fetched from OData");
//     return;
// }

// // Convert contexts to JSON objects
// const nodes = aContexts.map(ctx => ctx.getObject());


            const nodes = [
                { ZLabel: "Utworzone", Description: "abc" },
                { ZLabel: "B", Description: "bc" },
                { ZLabel: "C", Description: "aa" }
            ];
            const edges = [[0, 1],[1,2]];

            const oVBox = this.getView().byId("graphBox");

            // SVG container
            const oEdgeHTML = new HTML({
                content: `<svg id="graphEdges" width="100%" height="600" style="position:absolute; top:0; left:0;"></svg>`
            });
            oVBox.addItem(oEdgeHTML);

            let svg = null;
            const lineElements = [];

            // Theme colors
            const defaultLineColor = Parameters.get("sapUiContentForegroundBorderColor") || "black";
            const defaultArrowColor = Parameters.get("sapUiContentForegroundBorderColor") || "black";
            const highlightColor = Parameters.get("sapUiHighlight") || "blue";

            // ---- Horizontal Hierarchical Layout ----
            function layoutNodesHorizontal() {
       const xStart = 100;      // starting X position
    const xSpacing = 250;    // horizontal distance between nodes
    const yBase = 200;       // base Y position

    nodes.forEach((node, idx) => {
        // Assign a random vertical offset once per node
        if (node.yOffsetRandom === undefined) {
            node.yOffsetRandom = (Math.random() - 0.5) * 60; // +/- 30 px
        }

        node.x = xStart + idx * xSpacing;         // evenly spaced horizontally
        node.y = yBase + node.yOffsetRandom;      // vertical offset
    });
}


            // Intersection calculation
            function shortenLine(x1, y1, x2, y2, margin) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        // Avoid division by zero if nodes overlap
        return { start: { x: x1, y: y1 }, end: { x: x2, y: y2 } };
    }

    // Normalized direction vector
    const ux = dx / length;
    const uy = dy / length;

    return {
        start: { x: x1 + ux * margin, y: y1 + uy * margin },
        end:   { x: x2 - ux * margin, y: y2 - uy * margin }
    };
}


            // Create node buttons
            nodes.forEach((node) => {
                const oButton = new Button({
                    text: node.ZLabel,
                    press: async () => {
                        this.oDialog ??= await this.loadFragment({ name: "ui5.walkthrough.view.HelloDialog" });
                        const oText = this.oDialog.getContent()[1];
                        oText.setText(node.Description);
                        this.oDialog.open();
                    }
                });
                node.button = oButton;
                oVBox.addItem(oButton);
            });

            // Draw nodes + edges
           function updatePositions() {
    layoutNodesHorizontal(); // Step 1: position nodes

    // --- Step 2: place node buttons ---
    nodes.forEach((node) => {
        const dom = node.button.getDomRef();
        if (dom) {
            dom.style.position = "absolute";
            dom.style.left = node.x + "px";
            dom.style.top = node.y + "px";
        }
    });

    if (!svg) return;

    // --- Step 3: clear old edges ---
    svg.innerHTML = "<defs></defs>";
    const defs = svg.querySelector("defs");
    lineElements.length = 0;

    // --- Step 4: draw each edge ---
    edges.forEach((e, idx) => {
        const n1 = nodes[e[0]];
        const n2 = nodes[e[1]];

        const w1 = n1.button.getDomRef().offsetWidth;
        const h1 = n1.button.getDomRef().offsetHeight;
        const w2 = n2.button.getDomRef().offsetWidth;
        const h2 = n2.button.getDomRef().offsetHeight;

        // Use node centers
        const x1c = n1.x + w1 / 2,
              y1c = n1.y + h1 / 2,
              x2c = n2.x + w2 / 2,
              y2c = n2.y + h2 / 2;

        // Shorten line by 10px margin from each node center
        const { start: finalStart, end: finalEnd } = shortenLine(x1c, y1c, x2c, y2c, 15);

        // --- Define arrow marker ---
        const markerId = `arrow${idx}`;
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", markerId);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "10");
        marker.setAttribute("refX", "10");
        marker.setAttribute("refY", "5");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "userSpaceOnUse");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M0,0 L10,5 L0,10 Z"); // triangle
        path.setAttribute("fill", defaultArrowColor);
        marker.appendChild(path);
        defs.appendChild(marker);

        // --- Draw forward arrow ---
        const lineForward = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineForward.setAttribute("x1", finalStart.x);
        lineForward.setAttribute("y1", finalStart.y);
        lineForward.setAttribute("x2", finalEnd.x);
        lineForward.setAttribute("y2", finalEnd.y);
        lineForward.setAttribute("stroke", defaultLineColor);
        lineForward.setAttribute("stroke-width", "2");
        lineForward.setAttribute("marker-end", `url(#${markerId})`);
        svg.appendChild(lineForward);

        // --- Draw backward arrow if reverse exists ---
        let lineBackward = null;
        const reverseEdgeIndex = edges.findIndex(edge => edge[0] === e[1] && edge[1] === e[0]);
        if (reverseEdgeIndex !== -1) {
            lineBackward = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lineBackward.setAttribute("x1", finalEnd.x);
            lineBackward.setAttribute("y1", finalEnd.y);
            lineBackward.setAttribute("x2", finalStart.x);
            lineBackward.setAttribute("y2", finalStart.y);
            lineBackward.setAttribute("stroke", defaultLineColor);
            lineBackward.setAttribute("stroke-width", "2");
            lineBackward.setAttribute("marker-end", `url(#${markerId})`);
            svg.appendChild(lineBackward);
        }

        // --- Highlight logic ---
        const updateHighlight = () => {
            lineElements.forEach(le => {
                le.lineForward.setAttribute("stroke", defaultLineColor);
                if (le.lineBackward) le.lineBackward.setAttribute("stroke", defaultLineColor);
                le.path.setAttribute("fill", defaultArrowColor);
            });
            lineForward.setAttribute("stroke", highlightColor);
            if (lineBackward) lineBackward.setAttribute("stroke", highlightColor);
            path.setAttribute("fill", highlightColor);
        };

        lineForward.addEventListener("click", updateHighlight);
        if (lineBackward) lineBackward.addEventListener("click", updateHighlight);

        lineElements.push({ lineForward, lineBackward, path });
    });
}


            // Render edges after HTML is ready
            oEdgeHTML.addEventDelegate({
                onAfterRendering: function () {
                    svg = document.getElementById("graphEdges");
                    updatePositions();
                }
            });

            // Reset highlights when clicking outside
          oVBox.addEventDelegate({
    onclick: (event) => {
        const target = event.target;

        // Check if click is on any node button
        const isNodeButton = nodes.some(n => {
            const dom = n.button.getDomRef();
            return dom === target || (dom && dom.contains(target));
        });

        // Check if click is on any input or button inside the VBox
        const interactiveControls = Array.from(oVBox.getDomRef().querySelectorAll("input, button"));
        const isInteractive = interactiveControls.some(el => el === target || el.contains(target));

        // Check if click is on any line (forward or backward)
        const isEdge = lineElements.some(le => 
            le.lineForward === target || 
            (le.lineBackward && le.lineBackward === target)
        );

        if (!isNodeButton && !isEdge && !isInteractive) {
            // Reset all nodes to default
            nodes.forEach(n => n.button.setType("Default"));

            // Reset all lines
            lineElements.forEach(le => {
                le.lineForward.setAttribute("stroke", defaultLineColor);
                if (le.lineBackward) le.lineBackward.setAttribute("stroke", defaultLineColor);
                le.path.setAttribute("fill", defaultArrowColor);
            });
            setTimeout(updatePositions, 0);
        }
    }
});


            // Inputs and buttons
            const inputSource = new Input({ placeholder: "{i18n>sourceNodePlaceholder}" });
            const inputTarget = new Input({ placeholder: "{i18n>targetNodePlaceholder}" });
            const inputSearch = new Input({ placeholder: "{i18n>searchInputText}" });

            // Adding a new edge
            const addButton = new Button({
                text: "{i18n>addEdgeButton}",
                press: () => {
                    const srcLabel = inputSource.getValue().trim();
                    const tgtLabel = inputTarget.getValue().trim();
                    const srcIndex = nodes.findIndex(n => n.ZLabel === srcLabel);
                    const tgtIndex = nodes.findIndex(n => n.ZLabel === tgtLabel);

                    if (!srcLabel || !tgtLabel) return;
                    if (edges.some(e => e[0] === srcIndex && e[1] === tgtIndex)) {
                        MessageBox.error(oBundle.getText("connectionExistsText"));
                    } else if (srcIndex !== -1 && tgtIndex !== -1) {
                        edges.push([srcIndex, tgtIndex]);
                        // Create a new edge
                        // edgeListBindng.create({
                        //     ZFrom: srcIndex + 1,
                        //     ZTo: tgtIndex + 1
                        // });

                        // // Submit the batch to OData
                        // oModel.submitBatch("$auto");
                        updatePositions();
                        MessageToast.show(oBundle.getText("connectionAddedText"), { duration: 3000 });
                    } else {
                        MessageBox.error(oBundle.getText("invalidLabelsText"));
                    }
                }
            });


            //Deleting an existing edge
            const deleteButton = new Button({
                text: "{i18n>deleteEdgeButton}",
                press: () => {
                    const srcLabel = inputSource.getValue().trim();
                    const tgtLabel = inputTarget.getValue().trim();
                    const srcIndex = nodes.findIndex(n => n.ZLabel === srcLabel);
                    const tgtIndex = nodes.findIndex(n => n.ZLabel === tgtLabel);
                    const edgeIndex = edges.findIndex(e => e[0] === srcIndex && e[1] === tgtIndex);

                    if (edgeIndex !== -1) {
                        edges.splice(edgeIndex, 1);
                        updatePositions();
                        // Get the edge context by index
                        // var edgeContext = edgeContexts[edgeIndex];

                        // // Delete the edge
                        // edgeContext.delete();
                        MessageToast.show(oBundle.getText("connectionRemovedText"), { duration: 3000 });
                    } else {
                        MessageBox.error(oBundle.getText("connectionNotExistText"));
                    }
                }
            });



            //Highlighting a node
            const searchButton = new Button({
                text: "{i18n>searchNodeButtonText}",
                press: () => {
                    const searchLabel = inputSearch.getValue().trim();
                    var found = false;
                    nodes.forEach(n => {
                        if (n.ZLabel === searchLabel) {
                            found = true;
                            n.button.setType("Emphasized");
                        } else {
                            n.button.setType("Default");
                        }
                    });
                    setTimeout(updatePositions, 0);
                    MessageToast.show(found ? oBundle.getText("nodeFoundText") : oBundle.getText("nodeNotFoundText"), { duration: 3000 });
                }
            });


            //Container for the inputs and buttons
            const inputBox = new HBox({
                items: [inputSource, inputTarget, addButton, deleteButton, new VBox({ width: "20%" }), inputSearch, searchButton],
                justifyContent: "Center",
                alignItems: "Center",
                width: "100%",
                fitContainer: true,
                class: "sapUiMediumMarginBegin"
            });

            oVBox.addItem(inputBox);
        },

        async onDialogOpen() {
            this.oDialog ??= await this.loadFragment({ name: "ui5.walkthrough.view.HelloDialog" });
            this.oDialog.open();
        },

        onCloseDialog() {
            this.byId("helloDialog").close();
        }

    });
});
