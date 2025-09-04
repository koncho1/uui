sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/HBox",
    "sap/ui/core/HTML",
    "sap/ui/core/Fragment"
], function (Controller, Button, VBox, Input, HBox, HTML, Fragment) {
    "use strict";

    return Controller.extend("ui5.walkthrough.controller.App", {

        onInit: async function () {
            const oVBox = this.getView().byId("graphBox");

            // SVG for edges
            const oEdgeHTML = new HTML({
                content: `<svg id="graphEdges" width="100%" height="600" style="position:absolute; top:0; left:0;">
                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
                                    <path d="M0,0 L10,5 L0,10 Z" fill="black" />
                                </marker>
                            </defs>
                          </svg>`
            });
            oVBox.addItem(oEdgeHTML);

            // Helper: intersect line with rectangle
            function intersectRect(cx, cy, w, h, dx, dy) {
                const halfW = w / 2, halfH = h / 2;
                const tX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
                const tY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
                const t = Math.min(tX, tY);
                return { x: cx + dx * t, y: cy + dy * t };
            }

            try {
                // Fetch nodes from OData V4
                const oModel = this.getOwnerComponent().getModel("nodeModel");
                const oListBinding = oModel.bindList("/ZKC_CV_NODE", undefined, undefined, undefined, { $$groupId: "$direct" });
                const edgeListBindng = oModel.bindList("/ZKC_CV_EDGE");
                const edgeContexts = await edgeListBindng.requestContexts();

                const aEdges = edgeContexts.map(ctx => ctx.getObject());
                var edges = [];
                aEdges.forEach((edge) => {
                    edges.push([edge.ZFrom -1, edge.ZTo -1]);
                })
                const aContexts = await oListBinding.requestContexts();

                if (!Array.isArray(aContexts) || aContexts.length === 0) {
                    console.error("No nodes fetched from OData");
                    return;
                }

                // Convert contexts to JSON objects
                const nodes = aContexts.map(ctx => ctx.getObject());

                // Assign default positions if needed
                nodes.forEach((node, index) => {
                    node.x = 100 + index * 150;
                    node.y = 200 + (index % 2) * 100;
                });

                // Create buttons for each node
                nodes.forEach((node, index) => {
                    const oButton = new Button({
                        text: node.ZLabel,
                        press: async () => {
                            this.oDialog ??= await this.loadFragment({
                                name: "ui5.walkthrough.view.HelloDialog"
                            });
                            const oText = this.oDialog.getContent()[1];
                            oText.setText(node.Description);
                            this.oDialog.open();
                        }
                    });

                    node.button = oButton;
                    oVBox.addItem(oButton);

                    // Dragging
                    const dragData = { dragging: false, offsetX: 0, offsetY: 0 };
                    oButton.attachBrowserEvent("mousedown", (e) => {
                        dragData.dragging = true;
                        dragData.offsetX = e.clientX - node.x;
                        dragData.offsetY = e.clientY - node.y;
                    });
                    document.addEventListener("mousemove", (e) => {
                        if (dragData.dragging) {
                            node.x = e.clientX - dragData.offsetX;
                            node.y = e.clientY - dragData.offsetY;
                            updatePositions();
                        }
                    });
                    document.addEventListener("mouseup", () => { dragData.dragging = false; });
                });

                // SVG lines
                let svg = null;
                oEdgeHTML.addEventDelegate({
                    onAfterRendering: function () {
                        svg = document.getElementById("graphEdges");
                        updatePositions();
                    }
                });

                const lineElements = [];

                function updatePositions() {
                    // Update button positions
                    nodes.forEach(function (node) {
                        const dom = node.button.getDomRef();
                        if (dom) {
                            dom.style.position = "absolute";
                            dom.style.left = node.x + "px";
                            dom.style.top = node.y + "px";
                        }
                    });

                    if (!svg) return;
                    svg.innerHTML = '<defs>' +
                                    '<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">' +
                                    '<path d="M0,0 L10,5 L0,10 Z" fill="black" />' +
                                    '</marker>' +
                                    '</defs>';


                    edges.forEach(function (e, idx) {
                        const n1 = nodes[e[0]], n2 = nodes[e[1]];

                        const w1 = n1.button.getDomRef().offsetWidth;
                        const h1 = n1.button.getDomRef().offsetHeight;
                        const w2 = n2.button.getDomRef().offsetWidth;
                        const h2 = n2.button.getDomRef().offsetHeight;

                        const x1c = n1.x + w1 / 2;
                        const y1c = n1.y + h1 / 2;
                        const x2c = n2.x + w2 / 2;
                        const y2c = n2.y + h2 / 2;

                        const dx = x2c - x1c;
                        const dy = y2c - y1c;

                        const start = intersectRect(x1c, y1c, w1, h1, dx, dy);
                        const end = intersectRect(x2c, y2c, w2, h2, -dx, -dy);

                        const markerId = "arrow" + idx;
                        const defs = svg.querySelector("defs");
                        const marker = document.createElementNS("http://www.w3.org/2000/svg","marker");
                        marker.setAttribute("id", markerId);
                        marker.setAttribute("markerWidth", "10");
                        marker.setAttribute("markerHeight", "10");
                        marker.setAttribute("refX", "10");
                        marker.setAttribute("refY", "5");
                        marker.setAttribute("orient", "auto");
                        const path = document.createElementNS("http://www.w3.org/2000/svg","path");
                        path.setAttribute("d","M0,0 L10,5 L0,10 Z");
                        path.setAttribute("fill","black");
                        marker.appendChild(path);
                        defs.appendChild(marker);

                        const line = document.createElementNS("http://www.w3.org/2000/svg","line");
                        line.setAttribute("x1", start.x);
                        line.setAttribute("y1", start.y);
                        line.setAttribute("x2", end.x);
                        line.setAttribute("y2", end.y);
                        line.setAttribute("stroke","black");
                        line.setAttribute("stroke-width","3");
                        line.setAttribute("marker-end","url(#" + markerId + ")");
                        svg.appendChild(line);

                        line.addEventListener("click", function() {
        lineElements.forEach(le => {
            le.line.setAttribute("stroke", "black");
            le.path.setAttribute("fill", "black");
        });

        line.setAttribute("stroke", "blue");
        path.setAttribute("fill", "blue");
    });

    lineElements.push({ line, path });
                    });
                }

              
                const inputSource = new Input({ placeholder: "{i18n>sourceNodePlaceholder}" });
                const inputTarget = new Input({ placeholder: "{i18n>targetNodePlaceholder}" });
                const addButton = new Button({
                    text: "{i18n>addEdgeButton}",
                    press: function () {
                        const srcLabel = inputSource.getValue().trim();
                        const tgtLabel = inputTarget.getValue().trim();
                        if (!srcLabel || !tgtLabel) return;
                        const srcIndex = nodes.findIndex(n => n.ZLabel === srcLabel);
                        const tgtIndex = nodes.findIndex(n => n.ZLabel === tgtLabel);
                        if (edges.some(edge => edge[0] === srcIndex && edge[1] === tgtIndex)) {
                            alert("This edge already exists");
                        } else if (srcIndex !== -1 && tgtIndex !== -1) {
                            edges.push([srcIndex, tgtIndex]);
                            edgeListBindng.create({
                                ZFrom: srcIndex + 1,
                                ZTo: tgtIndex + 1
                            })
                            oModel.submitBatch("$auto");
                            updatePositions();
                        } else {
                            alert("Invalid node labels");
                        }
                    }
                });
                const deleteButton = new Button({
                    text: "{i18n>deleteEdgeButton}",
                    press: function () {
                        const srcLabel = inputSource.getValue().trim();
                        const tgtLabel = inputTarget.getValue().trim();
                        const srcIndex = nodes.findIndex(n => n.ZLabel === srcLabel);
                        const tgtIndex = nodes.findIndex(n => n.ZLabel === tgtLabel);
                        const edgeIndex = edges.findIndex(e => e[0] === srcIndex && e[1] === tgtIndex);
                        if (edgeIndex !== -1) {
                            edges.splice(edgeIndex, 1);
                            var edgeContext = edgeContexts[edgeIndex];
                            edgeContext.delete();
                            updatePositions();
                        } else {
                            alert("This connection doesn't exist");
                        }
                    }
                });
                const inputSearch = new Input({ placeholder: "{i18n>searchInputText}" });
                const searchButton = new Button({
                    text: "{i18n>searchNodeButtonText}",
                    press: function () {
                        const searchLabel = inputSearch.getValue().trim();
                        nodes.forEach(function (n) {
                            n.button.setType(n.ZLabel === searchLabel ? "Success" : "Default");
                        });
                        setTimeout(updatePositions, 0);
                    }
                });
                const inputBox = new HBox({
                    items: [inputSource, inputTarget, addButton, deleteButton,new VBox({width: "20%"}) , inputSearch, searchButton],
                    justifyContent: "Center",
                    alignItems: "Center",
                    width: "100%",
                    fitContainer: true,
                    class: "sapUiMediumMarginBegin"
                });
                oVBox.addItem(inputBox);

            } catch (err) {
                console.error("Error fetching nodes from OData:", err);
            }
        },

        async onDialogOpen() {
            this.oDialog ??= await this.loadFragment({
                name: "ui5.walkthrough.view.HelloDialog"
            });
            this.oDialog.open();
        },

        onCloseDialog() {
            this.byId("helloDialog").close();
        }

    });
});
