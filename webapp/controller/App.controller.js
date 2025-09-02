sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Input",
    "sap/m/HBox",
    "sap/ui/core/HTML"
], function (Controller, Button, VBox, Input, HBox, HTML) {
    "use strict";

    return Controller.extend("myApp.controller.Main", {
        onInit: function () {
            var oVBox = this.getView().byId("graphBox");

            // SVG for edges
            var oEdgeHTML = new HTML({
                content: '<svg id="graphEdges" width="500" height="400" style="position:absolute; top:0; left:0;">' +
                         '<defs>' +
                         '<marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">' +
                         '<path d="M0,0 L10,5 L0,10 Z" fill="black" />' +
                         '</marker>' +
                         '</defs>' +
                         '</svg>'
            });
            oVBox.addItem(oEdgeHTML);

            // Node data
            var nodes = [
                { id: "node1", label: "A" },
                { id: "node2", label: "B" },
                { id: "node3", label: "C" },
                { id: "node4", label: "D" }
            ];

            // Edge data
            var edges = [[0,1],[1,2],[2,0],[0,3]];

            // Create buttons as nodes
            nodes.forEach(function(node){
                var oButton = new Button({ 
					text: node.label,
					press: ".onOpenDialog"
				}).addStyleClass("circleButton");
                node.button = oButton;
                node.x = Math.random()*400 + 50;
                node.y = Math.random()*300 + 50;
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
                nodes.forEach(function(node){
                    var dom = node.button.getDomRef();
                    if(dom){
                        dom.style.position = "absolute";
                        dom.style.left = node.x + "px";
                        dom.style.top = node.y + "px";
                    }
                });

                if(svg){
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
    var dist = Math.sqrt(dx*dx + dy*dy) || 1;
    var ux = dx/dist, uy = dy/dist;

    var r1 = Math.min(w1, h1)/2;
    var r2 = Math.min(w2, h2)/2;

    var x1 = x1c + ux*r1;
    var y1 = y1c + uy*r1;
    var x2 = x2c - ux*r2;
    var y2 = y2c - uy*r2;

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
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke","black");
    line.setAttribute("stroke-width","2");
    line.setAttribute("marker-end","url(#" + markerId + ")");

    // Add click listener
    line.addEventListener("click", function(){
        // Reset all lines to black
        lineElements.forEach(function(le){
            le.line.setAttribute("stroke","black");
            le.path.setAttribute("fill","black");
        });

        // Highlight clicked line
        line.setAttribute("stroke","blue");
        path.setAttribute("fill","blue");
    });

    svg.appendChild(line);

    // Keep reference for later reset
    lineElements.push({ line: line, path: path });
});
                }
            }

            // Input fields for adding new edges
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
                    if(srcIndex !== -1 && tgtIndex !== -1){
                        edges.push([srcIndex, tgtIndex]);
                        updatePositions();
                    } else {
                        alert("Invalid node labels");
                    }
                }
            });

            // Input for searching/highlighting a node
            var inputSearch = new Input({ placeholder: "Search Node Label" });
            var searchButton = new Button({
                text: "Highlight Node",
                press: function(){
                    var searchLabel = inputSearch.getValue().trim();
                    nodes.forEach(function(n){
                        var dom = n.button.getDomRef();
                        if(dom){
                            if(n.label === searchLabel){
                                dom.style.backgroundColor = "#FF9800"; // highlight color
                            } 
							else{
								dom.style.backgroundColor = "white";
							}
                        }
                    });
                }
            });

            var inputBox = new HBox({
                items: [inputSource, inputTarget, addButton, inputSearch, searchButton],
                justifyContent:"Center",
                alignItems:"Center",
                width:"100%",
                fitContainer: true,
                class:"sapUiSmallMargin"
            });
            oVBox.addItem(inputBox);
        },
		 _openNodeDialog: function(nodeLabel) {
            if (!this._oDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "ui5.walkthrough.view.NodeDialog",
                    controller: this
                }).then(function(oDialog) {
                    this._oDialog = oDialog;
                    this.getView().addDependent(this._oDialog);
                    this._showDialog(nodeLabel);
                }.bind(this));
            } else {
                this._showDialog(nodeLabel);
            }
        },

        _showDialog: function(nodeLabel) {
            var oText = this._oDialog.getContent()[0]; // the Text control
            oText.setText("You clicked node: " + nodeLabel);
            this._oDialog.open();
        },

		async onOpenDialog() {
			this.oDialog ??= await this.loadFragment({
				name: "ui5.walkthrough.view.NodeDialog"
			});
			this.oDialog.open();
		},

        onCloseDialog: function() {
            if (this._oDialog) {
                this._oDialog.close();
            }
        }
    });
});
