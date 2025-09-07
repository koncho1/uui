sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/HBox",
    "sap/ui/core/HTML",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, Button, VBox, Input, HBox, HTML, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("ui5.walkthrough.controller.App", {

        onInit: async function () {

            const nodes = [
                { ZLabel: "Utworzone", Description: "abc" },
                { ZLabel: "B", Description: "bc" },
                { ZLabel: "C", Description: "aa" }
            ];
            const edges = [[0, 1]];

            const oVBox = this.getView().byId("graphBox");

            // SVG container
            const oEdgeHTML = new HTML({
                content: `<svg id="graphEdges" width="100%" height="600" style="position:absolute; top:0; left:0;">
                          </svg>`
            });
            oVBox.addItem(oEdgeHTML);

            let svg = null;
            const lineElements = [];

            function intersectRect(cx, cy, w, h, dx, dy) {
                const halfW = w / 2, halfH = h / 2;
                const tX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
                const tY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
                const t = Math.min(tX, tY);
                return { x: cx + dx * t, y: cy + dy * t };
            }

            nodes.forEach((node, index) => {
                node.x = 100 + index * 150;
                node.y = 200 + (index % 2) * 100;
            });

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

            function updatePositions() {
                nodes.forEach((node) => {
                    const dom = node.button.getDomRef();
                    if (dom) {
                        dom.style.position = "absolute";
                        dom.style.left = node.x + "px";
                        dom.style.top = node.y + "px";
                    }
                });

                if (!svg) return;

                // Clear existing lines and markers
                svg.innerHTML = "<defs></defs>";
                const defs = svg.querySelector("defs");

                edges.forEach((e, idx) => {
                    const n1 = nodes[e[0]], n2 = nodes[e[1]];
                    const w1 = n1.button.getDomRef().offsetWidth;
                    const h1 = n1.button.getDomRef().offsetHeight;
                    const w2 = n2.button.getDomRef().offsetWidth;
                    const h2 = n2.button.getDomRef().offsetHeight;

                    const x1c = n1.x + w1 / 2, y1c = n1.y + h1 / 2;
                    const x2c = n2.x + w2 / 2, y2c = n2.y + h2 / 2;
                    const dx = x2c - x1c, dy = y2c - y1c;
                    const offset = -5;

                    const start = intersectRect(x1c, y1c, w1, h1, dx, dy);
                    const end = intersectRect(x2c, y2c, w2, h2, -dx, -dy);
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const ux = dx / length, uy = dy / length;

                    const finalStart = { x: start.x + ux * offset, y: start.y + uy * offset };
                    const finalEnd = { x: end.x - ux * offset, y: end.y - uy * offset };

                    // Create marker per edge
                    const markerId = `arrow${idx}`;
                    const marker = document.createElementNS("http://www.w3.org/2000/svg","marker");
                    marker.setAttribute("id", markerId);
                    marker.setAttribute("markerWidth", "10");
                    marker.setAttribute("markerHeight", "10");
                    marker.setAttribute("refX", "10");
                    marker.setAttribute("refY", "5");
                    marker.setAttribute("orient", "auto");
                    marker.setAttribute("markerUnits", "userSpaceOnUse");

                    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path.setAttribute("d","M0,0 L10,5 L0,10 Z");
                    path.setAttribute("fill","black");
                    marker.appendChild(path);
                    defs.appendChild(marker);

                    // Create the line
                    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
                    line.setAttribute("x1", finalStart.x);
                    line.setAttribute("y1", finalStart.y);
                    line.setAttribute("x2", finalEnd.x);
                    line.setAttribute("y2", finalEnd.y);
                    line.setAttribute("stroke","black");
                    line.setAttribute("stroke-width","4");
                    line.setAttribute("marker-end",`url(#${markerId})`);
                    svg.appendChild(line);

                    // Click event updates line and arrow color
                    line.addEventListener("click", (event) => {
                        event.stopPropagation();
                        lineElements.forEach(le => {
                            le.line.setAttribute("stroke","black");
                            le.path.setAttribute("fill","black");
                        });
                        line.setAttribute("stroke","blue");
                        path.setAttribute("fill","blue");
                    });

                    lineElements.push({ line, path });
                });
            }

            oEdgeHTML.addEventDelegate({
                onAfterRendering: function () {
                    svg = document.getElementById("graphEdges");
                    updatePositions();
                }
            });

            oVBox.addEventDelegate({
                onclick: (event) => {
                    const target = event.target;
                    const isNodeButton = nodes.some(n => n.button.getDomRef() === target || n.button.getDomRef().contains(target));
                    const isEdge = lineElements.some(le => le.line === target);
                    if (!isNodeButton && !isEdge) {
                        nodes.forEach(n => n.button.setType("Default"));
                        lineElements.forEach(le => {
                            le.line.setAttribute("stroke","black");
                            le.path.setAttribute("fill","black");
                        });
                         setTimeout(updatePositions, 0);

                    }
                }
            });

            // Inputs and buttons
            const inputSource = new Input({ placeholder: "{i18n>sourceNodePlaceholder}" });
            const inputTarget = new Input({ placeholder: "{i18n>targetNodePlaceholder}" });
            const inputSearch = new Input({ placeholder: "{i18n>searchInputText}" });

            const addButton = new Button({
                text: "{i18n>addEdgeButton}",
                press: () => {
                    const srcLabel = inputSource.getValue().trim();
                    const tgtLabel = inputTarget.getValue().trim();
                    const srcIndex = nodes.findIndex(n => n.ZLabel === srcLabel);
                    const tgtIndex = nodes.findIndex(n => n.ZLabel === tgtLabel);

                    if (!srcLabel || !tgtLabel) return;
                    if (edges.some(e => e[0] === srcIndex && e[1] === tgtIndex)) {
                        MessageBox.error("This connection already exists!");
                    } else if (srcIndex !== -1 && tgtIndex !== -1) {
                        edges.push([srcIndex, tgtIndex]);
                        updatePositions();
                        MessageToast.show("✅ Connection added!", { duration: 3000 });
                    } else {
                        MessageBox.error("Invalid node labels!");
                    }
                }
            });

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
                        MessageToast.show("✅ Connection removed!", { duration: 3000 });
                    } else {
                        MessageBox.error("This connection doesn't exist!");
                    }
                }
            });

            const searchButton = new Button({
                text: "{i18n>searchNodeButtonText}",
                press: () => {
                    const searchLabel = inputSearch.getValue().trim();
                    let found = false;
                    nodes.forEach(n => {
                        if (n.ZLabel === searchLabel) {
                            found = true;
                            n.button.setType("Emphasized");
                        } else {
                            n.button.setType("Default");
                        }
                    });
                     setTimeout(updatePositions, 0);

                    MessageToast.show(found ? "✅ Node found!" : "❌ Node not found!", { duration: 3000 });
                }
            });

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
