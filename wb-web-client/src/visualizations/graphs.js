import jQuery from 'jquery';
import { LegacyPlugin as Plugin } from '../utils.js';

const $jq = jQuery.noConflict();

Plugin.getPlugin('cytoscape_js',function(x){
  console.log(x);
  //loadCytoscapeForPersonLineage(elementsDirect, elementsFull, thisPerson)
  return;
});

//
//
// function loadCytoscapeForInteraction(data, types, clazz) {
//   Plugin.getPlugin('cytoscape_js_arbor', function() {
//     setupCyInteractionViewer(data, types, clazz)
//   });
// }
//
// function setupCytoscapeInteraction(data, types, clazz){
//   Plugin.getPlugin('cytoscape_js',function(){
//     loadCytoscapeForInteraction(data, types, clazz)
//     return;
//   });
// }
//
//
// function loadCytoscapeForPhenGraph(elements) {
//   Plugin.getPlugin('qtip', function() {
//     Plugin.getPlugin('cytoscape_js_qtip', function() {
//       Plugin.getPlugin('cytoscape_js_dagre', function() {
//         setupCyPhenGraph(elements);
//       });
//     });
//   });
// }
//
// function setupCytoscapePhenGraph(elements){
//   Plugin.getPlugin('cytoscape_js',function(){
//     loadCytoscapeForPhenGraph(elements)
//     return;
//   });
// }
//
function setupCytoscapePersonLineage(elementsDirect, elementsFull, thisPerson){
  Plugin.getPlugin('cytoscape_js',function(cytoscape){
    var cyPersonLineageAll = window.cyPersonLineageAll = cytoscape({
      container: document.getElementById('cyPersonLineageAll'),
      layout: { name: 'cose', directed: true, padding: 10 },
      style: cytoscape.stylesheet()
         .selector('node')
           .css({
             'content': 'data(name)',
             'text-valign': 'center',
             'color': 'black',
             'width': 'data(radius)',
             'height': 'data(radius)',
             'shape':'data(nodeshape)',
             'text-outline-width': 2,
             'background-color': '#bbb',
             'text-outline-color': '#bbb',
             'url' : 'data(url)'
           })
         .selector('edge')
           .css({
             'label': 'data(label)',
             'role': 'data(role)',
             'curve-style': 'bezier',
             'line-style': 'data(lineStyle)',
             'target-arrow-shape': 'data(targetArrowShape)',
             'target-arrow-color': 'data(lineColor)',
             'line-color': 'data(lineColor)',
             'color': 'data(lineColor)',
             'width': 5
           })
         .selector(':selected')
           .css({
             'background-color': 'black',
             'line-color': 'black',
             'target-arrow-color': 'black',
             'source-arrow-color': 'black'
           })
         .selector('.faded')
           .css({
             'opacity': 0.25,
             'text-opacity': 0
           }),
      elements: elementsDirect,
      wheelSensitivity: 0.2,

      ready: function(){
        window.cyPersonLineageAll = this;
        cyPersonLineageAll.elements().unselectify();
        $jq('#cyPersonLineageAllLoading').hide();
        cyPersonLineageAll.on('tap', 'node', function(e){
          var node     = e.cyTarget;
          // var nodeId   = node.data('id');
          var neighborhood = node.neighborhood().add(node);
          cyPersonLineageAll.elements().addClass('faded');
          neighborhood.removeClass('faded');
          var url = this.data('url');
          window.open(url);
        });
        cyPersonLineageAll.on('tap', function(e){
          if( e.cyTarget === cyPersonLineageAll ){
            cyPersonLineageAll.elements().removeClass('faded');
          }
        });
      }
    });

    var jsonExportSaveDirect = '';
    var jsonExportSaveFull   = '';
    $jq('#toggleToFullView').on('click', function(){
      jsonExportSaveDirect = cyPersonLineageAll.json();     // save Full view for loading later
      $jq('#directViewTable').hide();
      $jq('#fullViewTable').show();
      if (jsonExportSaveFull === '') {                      // if there is no previous save for Full, render from elements
          cyPersonLineageAll.json( { elements: elementsFull } );
          cyPersonLineageAll.elements().layout({ name: 'breadthfirst', directed: true, padding: 10  });
        // for some reason needs to happen twice to render properly
          cyPersonLineageAll.json( { elements: elementsFull } );
          cyPersonLineageAll.elements().layout({ name: 'breadthfirst', directed: true, padding: 10  });
          if (elementsFull.nodes.length > 15) {             // arbitrary node amount cutoff to trigger zooming
            var pos = cyPersonLineageAll.nodes("#Full"+thisPerson).position();
            cyPersonLineageAll.zoom({ level: 1, position: pos }); }
        } else {                                            // if had previously loaded Full, render from saved json
          cyPersonLineageAll.json( jsonExportSaveFull );
      }
    });

    $jq('#toggleToDirectView').on('click', function(){
      jsonExportSaveFull = cyPersonLineageAll.json();       // save Full view for loading later
      $jq('#directViewTable').show();
      $jq('#fullViewTable').hide();
      cyPersonLineageAll.json( jsonExportSaveDirect );      // render Direct view from saved json
      updateFromCheckboxes();                               // when reloading 'Direct', update based on checkboxes, not sure why they become unhidden
    });

    $jq('#view_png_button').on('click', function(){
      var png64 = cyPersonLineageAll.png({ bg: 'white' });
      $jq('#png-export').attr('src', png64);
      $jq('#png-export').show();
      $jq('#cyPersonLineageAll').hide();
      $jq('#view_png_div').hide();
      $jq('#view_edit_div').show();
      $jq('#info').text('drag image to desktop, or right-click and save image as');
    });
    $jq('#view_edit_button').on('click', function(){
      $jq('#png-export').hide();
      $jq('#cyPersonLineageAll').show();
      $jq('#view_png_div').show();
      $jq('#view_edit_div').hide();
    });


    var optionsdiv        = document.getElementById('optionsdiv');
    var arrayOfInputs     = optionsdiv.getElementsByTagName("input");
    var arrayOfCheckboxes = [];
    for (var i = 0; i < arrayOfInputs.length; i++) {
      if (arrayOfInputs[i].type === "checkbox") {
        arrayOfCheckboxes.push(arrayOfInputs[i]);
        arrayOfInputs[i].onclick = function(event) { updateFromCheckboxes(); }    // when checkbox is clicked, update based on checkboxes
    } }

    function updateFromCheckboxes() {                                     // update cytoscape graph based on state of checkboxes
      cyPersonLineageAll.elements('edge').hide();                     // hide all edges
      var nodeHash = {};                                    // put nodes here that have an edge that shows
      for (var j = 0; j < arrayOfCheckboxes.length; j++) {                // for each checkbox
        if (arrayOfCheckboxes[j].checked) {                           // if the checkbox is checked
          var role = arrayOfCheckboxes[j].value;                      // get the role
          var arrayEdges = cyPersonLineageAll.elements('edge');       // get the edges in an array
          for (var k = 0; k < arrayEdges.length; k++) {                   // for each edge
            if (arrayEdges[k].data().role === role) {                  // if the edge has the checked role
              nodeHash[arrayEdges[k].data().source]++                 // add the source node to hash of nodes to show
              nodeHash[arrayEdges[k].data().target]++                 // add the target node to hash of nodes to show
              arrayEdges[k].show();                                   // show the edge
          } }
        }
      }
      cyPersonLineageAll.elements('node').hide();                     // hide all nodes
      cyPersonLineageAll.elements('node').filter(function(i, ele){    // filter on nodes
        if (nodeHash.hasOwnProperty(ele.id())) {                      // if the node is is in the hash of nodes to show
          ele.show();                                                 // show the node
        }
        return true; // Hey Juancarlos, this is a bit of an anti-pattern here.
                     // you might want to chain the filter with a map where you call ele.show()
      });
    }
  });
} // function setupCytoscapePersonLineage(elementsFull, elementsDirect, thisPerson)

// function setupCyPhenGraph(elements){
//   var cyPhenGraph = window.cyPhenGraph = cytoscape({
//     container: document.getElementById('cyPhenGraph'),
//     layout: { name: 'dagre', padding: 10, nodeSep: 5 },
//     style: cytoscape.stylesheet()
//       .selector('node')
//         .css({
//           'content': 'data(name)',
//           'background-color': 'white',
//           'shape': 'data(nodeShape)',
//           'border-color': 'data(nodeColor)',
//           'border-style': 'data(borderStyle)',
//           'border-width': 'data(borderWidth)',
//           'width': 'data(diameter)',
//           'height': 'data(diameter)',
//           'text-valign': 'center',
//           'text-wrap': 'wrap',
//           'min-zoomed-font-size': 8,
//           'border-opacity': 0.3,
//           'font-size': 'data(fontSize)'
//         })
//       .selector('edge')
//         .css({
//           'target-arrow-shape': 'none',
//           'source-arrow-shape': 'triangle',
//           'width': 2,
//           'line-color': '#ddd',
//           'target-arrow-color': '#ddd',
//           'source-arrow-color': '#ddd'
//         })
//       .selector('.highlighted')
//         .css({
//           'background-color': '#61bffc',
//           'line-color': '#61bffc',
//           'target-arrow-color': '#61bffc',
//           'transition-property': 'background-color, line-color, target-arrow-color',
//           'transition-duration': '0.5s'
//         })
//       .selector('.faded')
//         .css({
//           'opacity': 0.25,
//           'text-opacity': 0
//         }),
//     elements: elements,
//     wheelSensitivity: 0.2,
//
//     ready: function(){
//       window.cyPhenGraph = this;
//       cyPhenGraph.elements().unselectify();
//       $jq('#cyPhenGraphLoading').hide();
//
//       cyPhenGraph.on('tap', 'node', function(e){
//         var node = e.cyTarget;
//         var nodeId   = node.data('id');
//         var neighborhood = node.neighborhood().add(node);
//         cyPhenGraph.elements().addClass('faded');
//         neighborhood.removeClass('faded');
//
//         var node = e.cyTarget;
//         var nodeId   = node.data('id');
//         var nodeName = node.data('name');
//         var annotCounts = node.data('annotCounts');
//         var qtipContent = annotCounts + '<br/><a target="_blank" href="http://www.wormbase.org/species/all/phenotype/WBPhenotype:' + nodeId + '#03--10">' + nodeName + '</a>';
//         node.qtip({
//              position: {
//                my: 'top center',
//                at: 'bottom center'
//              },
//              style: {
//                classes: 'qtip-bootstrap',
//                tip: {
//                  width: 16,
//                  height: 8
//                }
//              },
//              content: qtipContent,
//              show: {
//                 e: e.type,
//                 ready: true
//              },
//              hide: {
//                 e: 'mouseout unfocus'
//              }
//         }, e);
//       });
//
//       cyPhenGraph.on('tap', function(e){
//         if( e.cyTarget === cyPhenGraph ){
//           cyPhenGraph.elements().removeClass('faded');
//         }
//       });
//
//       cyPhenGraph.on('mouseover', 'node', function(event) {
//           var node = event.cyTarget;
//           var nodeId   = node.data('id');
//           var nodeName = node.data('name');
//           var annotCounts = node.data('annotCounts');
//           var qtipContent = annotCounts + '<br/><a target="_blank" href="http://www.wormbase.org/species/all/phenotype/WBPhenotype:' + nodeId + '#03--10">' + nodeName + '</a>';
//           $jq('#info').html( qtipContent );
//       });
//     }
//
//   });
//
//   $jq('#radio_weighted').on('click', function(){
//     var nodes = cyPhenGraph.nodes();
//     for( var i = 0; i < nodes.length; i++ ){
//       var node     = nodes[i];
//       var nodeId   = node.data('id');
//       var diameterWeighted   = node.data('diameter_weighted');
//       cyPhenGraph.$('#' + nodeId).data('diameter', diameterWeighted);
//       var fontSizeWeighted   = node.data('fontSizeWeighted');
//       cyPhenGraph.$('#' + nodeId).data('fontSize', fontSizeWeighted);
//       var borderWidthWeighted   = node.data('borderWidthWeighted');
//       cyPhenGraph.$('#' + nodeId).data('borderWidth', borderWidthWeighted);
//     }
//     cyPhenGraph.layout();
//   });
//   $jq('#radio_unweighted').on('click', function(){
//     var nodes = cyPhenGraph.nodes();
//     for( var i = 0; i < nodes.length; i++ ){
//       var node     = nodes[i];
//       var nodeId   = node.data('id');
//       var diameterUnweighted = node.data('diameter_unweighted');
//       var diameterWeighted   = node.data('diameter_weighted');
//       cyPhenGraph.$('#' + nodeId).data('diameter', diameterUnweighted);
//       var fontSizeUnweighted = node.data('fontSizeUnweighted');
//       var fontSizeWeighted   = node.data('fontSizeWeighted');
//       cyPhenGraph.$('#' + nodeId).data('fontSize', fontSizeUnweighted);
//       var borderWidthUnweighted = node.data('borderWidthUnweighted');
//       var borderWidthWeighted   = node.data('borderWidthWeighted');
//       cyPhenGraph.$('#' + nodeId).data('borderWidth', borderWidthUnweighted);
//     }
//     cyPhenGraph.layout();
//   });
//   $jq('#view_png_button').on('click', function(){
//     var png64 = cyPhenGraph.png({ bg: 'white' });
//     $jq('#png-export').attr('src', png64);
//     $jq('#png-export').show();
//     $jq('#cyPhenGraph').hide();
//     $jq('#weightstate').hide();
//     $jq('#view_png_button').hide();
//     $jq('#view_edit_button').show();
//     $jq('#info').text('drag image to desktop, or right-click and save image as');
//   });
//   $jq('#view_edit_button').on('click', function(){
//     $jq('#png-export').hide();
//     $jq('#cyPhenGraph').show();
//     $jq('#weightstate').show();
//     $jq('#view_png_button').show();
//     $jq('#view_edit_button').hide();
//   });
// }
//
// function setupCyInteractionViewer(data, types, clazz){
//     /* Converts element attributes to their appropriate mapped values
//      * Any non-matching attributes will be matched to the "other" mapping
//      *     if exists
//         * data: data
//         * elementType: nodes or edges
//         * attr: some key under data[elementType][i].data
//         * mapping: obj mapping oldVal: newVal for attr
//         * (toType): new values will be put into this attr, if attr
//         *   shouldn't be touched
//     */
//     function mapAttr(elementType, attr, mapping, toType){
//         for(var i=0; i < data[elementType].length; i++){
//             var element = data[elementType][i]['data'][attr];
//             toType = toType ? toType : attr;
//             if( mapping[element] ){
//                 data[elementType][i]['data'][toType] = mapping[element];
//             }else if(mapping['other']){
//                 data[elementType][i]['data'][toType] = mapping['other'];
//             }
//         }
//     }
//
//     // Execute custom mappers
//     for(var i=0; i < data.mappers.length; i++){
//         var m = data.mappers[i];
//         mapAttr(m.elementType, m.attribute, m.mapping, m.toType);
//     }
//
//     // Color of each type, in order.  Matches legend.  See interaction_details.tt2
//     var edgeColor = ["#0A6314", "#08298A","#B40431","#FF8000", "#00E300","#05C1F0", "#8000FF", "#69088A", "#B58904", "#E02D8A", "#FFFC2E" ];
//     var typeColorMapper = function(){
//         var map = {};
//         for(var i=0; i < types.length; i++){
//             // Predicted always black
//             map[ types[i] ] =
//                 (types[i] == 'Predicted') ? '#999' : edgeColor[i];
//         }
//         return map;
//     }();
//     //mapAttr('edges', 'type', typeColorMapper, 'color');
//
//     +function increaseBaseWidth(baseWidth){
//         for(var i=0; i < data['edges'].length; i++){
//             data['edges'][i]['data']['width'] += baseWidth;
//         }
//     }(1);
//
//
//         var legend = $jq('#cyto_legend');
//
//         $jq( "#cy" ).cytoscape({
//
//         style: cytoscape.stylesheet()
//             .selector('node')
//             .css({
//                 'opacity': 0.7,
//                 'border-width': 0,
//                 'shape': 'data(shape)',
//                 'content': 'data(name)',
//                 'text-valign': 'center',
//                 'color': 'black',
//                 'text-outline-color': 'white',
//                 'text-outline-width': 2
//             })
//             .selector('edge')
//             .css({
//                 'width': 'data(width)',
//                 'opacity':0.4,
//                 'line-color': 'data(color)',
//                 'line-style': 'solid'
//
//             })
//             .selector('edge[type="Predicted"]')
//             .css({
//                 'line-style': 'dotted'
//             })
//             .selector('edge[direction="Effector->Affected"]')
//             .css({
//                 'target-arrow-shape': 'triangle',
//                 'target-arrow-color': 'data(color)',
//                 'source-arrow-color': 'data(color)'
//             })
//             .selector('node[mainNode]')
//             .css({
//                 'height': '40px',
//                 'width': '40px',
//                 'background-color': 'red'
//             })
//             .selector(':selected')
//             .css({
//                 'opacity': 1,
//                 'border-color': 'black',
//                 'border-width': 2,
//             }),
//
//         elements: data,
//
//         layout: {
//             name: 'arbor',
//         },
//
//         ready: function(){
//             window.cy = this;
//
//             resetChecked();
//             updateEdgeFilter();
//             updateNodeFilter();
//
//             legend.find('input:checkbox').click(function(){
//                 if(this.name == 'interactionToggle'){
//                     if(this.checked){
//                         legend.find('input:checkbox[name="type"]').prop('checked',true);
//                     }else{
//                         legend.find('input:checkbox[name="type"]').prop('checked',false);
//                     }
//                 }
//                 if(this.name == 'phenotypeToggle'){
//                     if(this.checked){
//                         legend.find('input:checkbox[name="phenotype"]').prop('checked',true);
//                     }else{
//                         legend.find('input:checkbox[name="phenotype"]').prop('checked',false);
//                     }
//                 }
//
//                 updateEdgeFilter();
//                 updateNodeFilter();
//             });
//
//             cy.on('tap', 'node', function(e){
//                 window.open(e.cyTarget.data().link); });
//
//         }
//
//         });
//
//         function resetChecked(){
//             legend.find('input:checkbox').map(function(){
//                 var t = $jq(this);
//                 if (t.attr('name') == 'type'){
//                     t.prop('checked', (clazz === 'Predicted' ? true : (!t.val().match('Predicted'))));
//                 }else if(!(clazz === 'WBProcess' && t.val().match('nearby'))){
//                     // don't check nearby if process page
//                     t.prop('checked', true);
//                 }
//             });
//
//         }
//
//         // Hide all edges, show a subset, then hide all visible members of
//         // each non-asserted subset thereafter
//         function updateEdgeFilter(){
//             /* for all elements:
//              * make true those which
//              *  edge "type" value match the values of "type" checkboxes
//              *  edge "direction" value match the values of "direction" checkboxes
//              *
//              * NOTE: Can use cy.filter( function(i, ele) ) instead
//              */
//
//             cy.elements('edge').hide();
//
//             // Get arrays of valid edge types
//             var edgeTypes = legend.find('input[name="type"]:checked')
//                 .map(function(){ return this.getAttribute('value'); }).get()
//             var edgeDirs = legend.find('input[name="direction"]:checked')
//                 .map(function(){ return this.getAttribute('value'); }).get();
//             var edgePhens = legend.find('input[name="phenotype"]:checked')
//                 .map(function(){ return this.getAttribute('value'); }).get();
//
//             var nearbyExists = legend.find('input[name=nearby]').size() > 0 ?
//                 true : false;
//             var nearbyChecked =
//                 legend.find('input[name=nearby]:checked').size() > 0 ?
//                 true : false;
//
//             // restore checked edge types
//             cy.elements('edge').filter(function(i, ele){
//                 /**console.log({
//                     inEdgePhens: $jq.inArray(ele.data().phenotype, edgePhens),
//                     inEdgeTypes: $jq.inArray(ele.data().type,      edgeTypes),
//                     inEdgeDirs:  $jq.inArray(ele.data().direction, edgeDirs )
//                 });**/
//                 if(
//                     (!ele.data().phenotype || $jq.inArray(ele.data().phenotype, edgePhens) > -1) &&
//                     (!ele.data().type      || $jq.inArray(ele.data().type,      edgeTypes) > -1) &&
//                     (!ele.data().direction || $jq.inArray(ele.data().direction, edgeDirs ) > -1) &&
//                     (
//                         !nearbyExists || // is nearby asserted?
//                         ele.data().nearby == 0 || // non-nearby edges will show regardless
//                         (nearbyChecked && ele.data().nearby == 1)
//                     )
//                 ){
//                     return true;
//                 }else{
//                     return false;
//                 }
//             }).show();
//         }
//
//         // Show all nodes then hide all non-connected
//         function updateNodeFilter(){
//             cy.elements('node').show();
//
//             // Interactor types
//             var intTypes = legend.find('input[name=nodes]:not(:checked)')
//                 .map(function(){ return this.getAttribute('value'); }).get();
//
//             for (var i=0; i < intTypes.length; i++){
//                 var type = intTypes[i];
//                 cy.elements('node[^mainNode][ntype = "'+ type +'"]').hide();
//             }
//
//             // Hide nodes with no visible edges
//             cy.elements('node[^mainNode]').filter(function(i, ele){
//                 return ele.edgesWith('').allAre(':hidden');
//             }).hide();
//
//         }
//
// }
//
export {
  setupCytoscapePersonLineage,
  // setupCytoscapeInteraction,
  // setupCytoscapePhenGraph,
}
