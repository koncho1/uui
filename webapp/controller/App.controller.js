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

        onInit: function () {

            var oVBox = this.getView().byId("graphBox");

            // SVG for edges
            var oEdgeHTML = new HTML({
                content: '<svg id="graphEdges" width="100%" height="600" style="position:absolute; top:0; left:0;">' +
                         '<defs>' +
                         '<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">' +
                         '<path d="M0,0 L10,5 L0,10 Z" fill="black" />' +
                         '</marker>' +
                         '</defs>' +
                         '</svg>'
            });
            oVBox.addItem(oEdgeHTML);

            // Fixed node layout
            var layout = {
                node0: { x: 100, y: 200 },  
                node1: { x: 300, y: 150 },  
                node2: { x: 500, y: 100 },  
                node3: { x: 300, y: 250 },  
                node4: { x: 700, y: 150 },  
                node5: { x: 900, y: 150 }   
            };

            // Node data
            var nodes = [
                { id: "node0", label: "Utworzone", description:"lorem ipsum" },
                { id: "node1", label: "Akceptacja", description:"lorem ipsum"},
                { id: "node2", label: "Zatwierdzone", description:"lorem ipsum" },
                { id: "node3", label: "Odrzucone", description:"lorem ipsum"},
                { id: "node4", label: "Wysłane", description:"lorem ipsum"},
                { id: "node5", label: "Zakończone", description:"lorem ipsum"}
            ];

            // Edge data
            var edges = [[0,1],[0,3],[1,2],[1,3],[2,4],[4,5]];

            // Helper: intersect line with rectangle (button)
            function intersectRect(cx, cy, w, h, dx, dy) {
                const halfW = w/2, halfH = h/2;
                let tX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
                let tY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
                const t = Math.min(tX, tY);
                return { x: cx + dx * t, y: cy + dy * t };
            }

            // Create buttons as nodes
            nodes.forEach((node) => {
                var oButton = new Button({
                    text: node.label,
                    press: async () => {
                        this.oDialog ??= await this.loadFragment({
                            name: "ui5.walkthrough.view.HelloDialog"
                        });
                        const oText = this.oDialog.getContent()[1];
                        oText.setText(node.description);
                        this.oDialog.open();
                    }
                });

                node.button = oButton;
                node.x = layout[node.id].x;
                node.y = layout[node.id].y;

                oVBox.addItem(oButton);

                // Dragging
                var dragData = { dragging: false, offsetX:0, offsetY:0 };
                oButton.attachBrowserEvent("mousedown", function(e){
                    dragData.dragging = true;
                    dragData.offsetX = e.clientX - node.x;
                    dragData.offsetY = e.clientY - node.y;
                });
                document.addEventListener("mousemove", function(e){
                    if(dragData.dragging){
                        node.x = e.clientX - dragData.offsetX;
                        node.y = e.clientY - dragData.offsetY;
                        updatePositions();
                    }
                });
                document.addEventListener("mouseup", function(){ dragData.dragging = false; });
            });

            var svg = null;
            oEdgeHTML.addEventDelegate({
                onAfterRendering: function () {
                    svg = document.getElementById("graphEdges");
                    updatePositions();
                }
            });

            function updatePositions(){
                // Update button positions
                nodes.forEach(function(node){
                    var dom = node.button.getDomRef();
                    if(dom){
                        dom.style.position = "absolute";
                        dom.style.left = node.x + "px";
                        dom.style.top = node.y + "px";
                    }
                });

                if(!svg) return;
                svg.innerHTML = '<defs>' +
                                '<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">' +
                                '<path d="M0,0 L10,5 L0,10 Z" fill="black" />' +
                                '</marker>' +
                                '</defs>';

                var lineElements = [];

                edges.forEach(function(e, idx){
                    var n1 = nodes[e[0]], n2 = nodes[e[1]];

                    var w1 = n1.button.getDomRef().offsetWidth;
                    var h1 = n1.button.getDomRef().offsetHeight;
                    var w2 = n2.button.getDomRef().offsetWidth;
                    var h2 = n2.button.getDomRef().offsetHeight;

                    var x1c = n1.x + w1/2;
                    var y1c = n1.y + h1/2;
                    var x2c = n2.x + w2/2;
                    var y2c = n2.y + h2/2;

                    var dx = x2c - x1c;
                    var dy = y2c - y1c;

                    var start = intersectRect(x1c, y1c, w1, h1, dx, dy);
                    var end   = intersectRect(x2c, y2c, w2, h2, -dx, -dy);

                    // Unique marker for each line
                    var markerId = "arrow" + idx;
                    var defs = svg.querySelector("defs");
                    var marker = document.createElementNS("http://www.w3.org/2000/svg","marker");
                    marker.setAttribute("id", markerId);
                    marker.setAttribute("markerWidth", "10");
                    marker.setAttribute("markerHeight", "10");
                    marker.setAttribute("refX", "10");
                    marker.setAttribute("refY", "5");
                    marker.setAttribute("orient", "auto");
                    var path = document.createElementNS("http://www.w3.org/2000/svg","path");
                    path.setAttribute("d","M0,0 L10,5 L0,10 Z");
                    path.setAttribute("fill","black");
                    marker.appendChild(path);
                    defs.appendChild(marker);

                    var line = document.createElementNS("http://www.w3.org/2000/svg","line");
                    line.setAttribute("x1", start.x);
                    line.setAttribute("y1", start.y);
                    line.setAttribute("x2", end.x);
                    line.setAttribute("y2", end.y);
                    line.setAttribute("stroke","black");
                    line.setAttribute("stroke-width","3");
                    line.setAttribute("marker-end","url(#" + markerId + ")");

                    // Click listener to highlight line
                    line.addEventListener("click", function(){
                        lineElements.forEach(function(le){
                            le.line.setAttribute("stroke","black");
                            le.path.setAttribute("fill","black");
                        });
                        line.setAttribute("stroke","blue");
                        path.setAttribute("fill","blue");
                    });

                    svg.appendChild(line);
                    lineElements.push({ line: line, path: path });
                });
            }

            // Input fields for adding/deleting connections
            var inputSource = new Input({ placeholder: "Source Node Label" });
            var inputTarget = new Input({ placeholder: "Target Node Label" });
            var addButton = new Button({
                text: "Add Connection",
                press: function(){
                    var srcLabel = inputSource.getValue().trim();
                    var tgtLabel = inputTarget.getValue().trim();
                    if(!srcLabel || !tgtLabel) return;
                    var srcIndex = nodes.findIndex(n => n.label === srcLabel);
                    var tgtIndex = nodes.findIndex(n => n.label === tgtLabel);
                    if(JSON.stringify(edges).includes(JSON.stringify([srcIndex, tgtIndex]))){
                        alert("This edge already exists");
                    }
                    else if(srcIndex !== -1 && tgtIndex !== -1){
                        edges.push([srcIndex, tgtIndex]);
                        updatePositions();
                    } else { alert("Invalid node labels"); }
                }
            });
            var deleteButton = new Button({
                text: "Delete Connection",
                press: function(){
                    var srcLabel = inputSource.getValue().trim();
                    var tgtLabel = inputTarget.getValue().trim();
                    if(!srcLabel || !tgtLabel) return;
                    var srcIndex = nodes.findIndex(n => n.label === srcLabel);
                    var tgtIndex = nodes.findIndex(n => n.label === tgtLabel);
                    if(JSON.stringify(edges).includes(JSON.stringify([srcIndex, tgtIndex]))){
                        edges.forEach((edge, index) => {
                            if(edge[0] === srcIndex && edge[1] === tgtIndex){
                                edges.splice(index, 1);
                            }
                        });
                        updatePositions();
                    } else if(srcIndex !== -1 && tgtIndex !== -1){
                        alert("This connection doesn't exist")
                    } else { alert("Invalid node labels"); }
                }
            });

            // Input for highlighting node
            var inputSearch = new Input({ placeholder: "Search Node Label" });
            var searchButton = new Button({
                text: "Highlight Node",
                press: function(){
                    var searchLabel = inputSearch.getValue().trim();
                    nodes.forEach(function(n){
                        if (n.label === searchLabel) {
                            n.button.setType("Success"); // Highlight
                        } else {
                            n.button.setType("Default");  // Reset others
                        }
                    });
                    setTimeout(updatePositions, 0);
                }
            });

            var inputBox = new HBox({
                items: [inputSource, inputTarget, addButton, deleteButton, inputSearch, searchButton],
                justifyContent:"Center",
                alignItems:"Center",
                width:"100%",
                fitContainer: true,
                class:"sapUiSmallMargin"
            });
            oVBox.addItem(inputBox);
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
