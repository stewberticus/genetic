

/* Alex Stuart 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
Number.prototype.toRad = function () {
    return this * Math.PI / 180;
};
mercator2latlon = function (coords) {
    return ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326')
};
latlon2mercator = function (coords) {
    return ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857')
};
othersideofearth = function(coord){
    var retcoord =[];
    var extent = [-20026376.39,20026376.39];
    retcoord[1] = coord[1];
    //[minx, miny, maxx, maxy].

    if(coord[0]<0){
        
     retcoord[0] = extent[1] + (coord[0] - extent[0]);
         
    } else if(coord[0]>0){
 
     retcoord[0] =  extent[0] - (extent[1] - coord[0]);
            
    }else{
       return coord;
    }
    return retcoord;
};
function lineDistance( point1, point2 )
{
  var xs = 0;
  var ys = 0;
 
  xs = point2[0] - point1[0];
  xs = xs * xs;
 
  ys = point2[1] - point1[1];
  ys = ys * ys;
 
  return Math.sqrt( xs + ys );
}
function getNotTaken(source, taken)
{
    for (var i = 0; i < MAP.pointsource.getFeatures().length; i++)
    {
        var trial = source[i];
        if (taken[trial] != true)
        {
            taken[trial] = true;
            return trial;
        }
    }
    return -1;
}
function arraysEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (a.length != b.length)
        return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
var MAP = function ($) {
    var map = {};


    map.init = function () {
        map.distArray =[];
        var osmLayer = new ol.layer.Tile({
            source: new ol.source.OSM(),
            extent:[-20026376.39,-20048966.10,20026376.39,20048966.10]

        });
        var numpoints = 0;
        var mapview = new ol.View({
            center: [-82, 43],
             extent:[-20026376.39,-20048966.10,20026376.39,20048966.10],
            zoom: 2,
            minZoom:2
        });
        map.olmap = new ol.Map({
            layers: [osmLayer],
            controls: ol.control.defaults(),
            interactions: ol.interaction.defaults(),
            target: 'map',
            view: mapview

        });
       
        map.pointsource = new ol.source.Vector();
        map.pointsource.on("addfeature", function (e) {
            //  alert("added");
            numpoints ++;
            $("#pointcounter").text(numpoints);
            var coords = e.feature.getGeometry().getCoordinates();
            console.log(mercator2latlon(coords));
//            var complimentcoords = othersideofearth(coords);
//            e.feature.getGeometry().setCoordinates(complimentcoords);
            map.distArray[map.pointsource.getFeatures().length-1] = [];
            var lonlat = mercator2latlon(coords);
            var text = "" + lonlat[1].toFixed(4) + ", " + lonlat[0].toFixed(4);
            e.feature.lonlat = lonlat;
            e.feature.latlonText = text;
            //console.log(text);
            var parentStyle = map.pointLayer.getStyle();
            // var textStyle = new ol.style.Text({
            //     text: text,
            //     font: 'bold 16px Calibri,sans-serif',
            //     offsetX: 0,
            //     offsetY: 11,
            //     stroke: new ol.style.Stroke({
            //         color: "#ffffff",
            //         width: 2
            //     }),
            //     fill: new ol.style.Fill({
            //         color: "#000000"
            //     })
            // });
            var featureStyle = new ol.style.Style({
                fill: parentStyle.getFill(),
                stroke: parentStyle.getStroke(),
                //text: textStyle,
                image: new ol.style.Circle({
                    radius: 3,
                    stroke: new ol.style.Stroke({
                        color: "#ffffff"
                    }),
                    fill: new ol.style.Fill({
                        color: "#000000"
                    })
                }),
                zindex: 999
            });
            e.feature.setStyle(featureStyle);
            connectlines(e.feature, map.pointLayer, map.lineLayer);
            map.pointsource.changed();

        });

        map.pointLayer = new ol.layer.Vector({
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffffff',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({
                        color: '#000000'
                    })
                })
            }),
            source: map.pointsource
        });
        map.linesource = new ol.source.Vector({
        });
        map.lineLayer = new ol.layer.Vector({
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: '#000000'
                }),
                stroke: new ol.style.Stroke({
                    color: '#000000',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 4,
                    fill: new ol.style.Fill({
                        color: '#000000'
                    })
                })
            }),
            source: map.linesource
        });
        map.soluSource = new ol.source.Vector();
        map.soluLayer = new ol.layer.Vector({
            extent:[-20026376.39,-20048966.10,20026376.39,20048966.10],
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "#FF00CC",
                    width: 4
                })
            }),
            source: map.soluSource
            
        });
        map.soluLayer.on("precompose",function(e){
           var context = e.context;
           var pixelRatio = e.frameState.pixelRatio;

           context.save();
           context.beginPath();
           //[-20526376.39,-20548966.10,20526376.39*2,20548966.10*2]
           var topleftcorner = map.olmap.getPixelFromCoordinate([-20526376.39,20548966.10]);
           var botrightcorner = map.olmap.getPixelFromCoordinate([20526376.39,-20548966.10])
           var height =   botrightcorner[1] - topleftcorner[1];
           var width = botrightcorner[0] - topleftcorner[0];
//           if (height>context.canvas.height)
//               height = context.canvas.height;
//           height = 2*height;
//           if(width>context.canvas.width)
//               width = context.canvas.width;

           context.rect(topleftcorner[0]*pixelRatio,topleftcorner[1]*pixelRatio,width*pixelRatio,height*pixelRatio);
          context.stroke();
           context.clip();
       });
       map.soluLayer.on("postcompose",function(e){
           var ctx = e.context;
           ctx.restore();
       });
        map.olmap.addLayer(map.lineLayer);
        
        map.olmap.addLayer(map.soluLayer);


        map.olmap.addLayer(map.pointLayer);
        
        
        
        connectlines = function (newfeature, player, llayer,i) {
            var plfeatures = player.getSource().getFeatures();
            if (plfeatures.length > 1)
                for (var i in plfeatures) {
                    //to clean up th UI
                    //createline(newfeature, plfeatures[i], llayer,parseInt(i));
                    
                }
        };
        
        createline = function (feat1, feat2, llayer,feat2index) {
            var coordArray = [];
            coordArray.push(feat1.getGeometry().getCoordinates());
            coordArray.push(feat2.getGeometry().getCoordinates());
            var line = new ol.geom.LineString(coordArray);
            var feature = new ol.Feature({
                geometry: line

            });
            var dist = map.haversine(mercator2latlon(coordArray[0]), mercator2latlon(coordArray[1]));
            map.distArray[feat2index][feat2index+1] = dist;
            if(map.distArray[feat2index+1])
            map.distArray[feat2index+1][feat2index] = dist;
            var text = "" + dist.toFixed(0);
            var parentStyle = llayer.getStyle();
//            var textStyle = new ol.style.Text({
//                text: text,
//                font: 'bold 16px Calibri,sans-serif',
//                offsetX: 0,
//                offsetY: 11,
//                stroke: new ol.style.Stroke({
//                    color: "#ffffff",
//                    width: 2
//                }),
//                fill: new ol.style.Fill({
//                    color: "#000000"
//                })
//            });
            var featureStyle = new ol.style.Style({
                fill: parentStyle.getFill(),
                stroke: parentStyle.getStroke(),
//                text: textStyle,
                image: new ol.style.Circle({
                    radius: 3,
                    stroke: new ol.style.Stroke({
                        color: "#ffffff"
                    }),
                    fill: new ol.style.Fill({
                        color: "#000000"
                    })
                }),
                zindex: 999
            });
            feature.setStyle(featureStyle);
            llayer.getSource().addFeature(feature);
        };
        map.haversine = function (lonlat1, lonlat2) {
            var lat1 = lonlat1[1];
            var lon1 = lonlat1[0];
            var lat2 = lonlat2[1];
            var lon2 = lonlat2[0];
            var R = 6371; // km 
            var x1 = lat2 - lat1;
            var dLat = x1.toRad();
            var x2 = lon2 - lon1;
            var dLon = x2.toRad();
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return d / 1.60934; //converted to miles


        };
        map.addRandomPoints = function(num){
            var features = [];
            for(var i = 0;i<num;i++){
                var point = [];
                point[0] = (Math.random() * 360) -180;
                point[1] = (Math.random() * 170) -85;
                var feat = new ol.Feature(new ol.geom.Point(latlon2mercator(point)));
                features.push(feat);

                
            }
            map.pointsource.addFeatures(features)
            map.pointsource.changed();
        };
        map.addsolution = function (solutionarray) {
            map.soluSource.clear();
            var feats = map.pointsource.getFeatures();
            for (var i = 0; i < solutionarray.length - 1; i++) {
                var coordArray = [];
//                console.log("without")
                var normalDist = lineDistance(feats[solutionarray[i]].getGeometry().getCoordinates(),feats[solutionarray[i + 1]].getGeometry().getCoordinates())
//                console.log(normalDist);
                var otherSideDist = lineDistance(feats[solutionarray[i]].getGeometry().getCoordinates(),othersideofearth(feats[solutionarray[i + 1]].getGeometry().getCoordinates()))
//                console.log("WITH")
//                console.log(otherSideDist)
                if(normalDist<otherSideDist){
                coordArray.push(feats[solutionarray[i]].getGeometry().getCoordinates());
                coordArray.push(feats[solutionarray[i + 1]].getGeometry().getCoordinates());
                }else{
                coordArray.push(feats[solutionarray[i]].getGeometry().getCoordinates());
                coordArray.push(othersideofearth(feats[solutionarray[i + 1]].getGeometry().getCoordinates()));   
                var complimentlinecoords =[];
                complimentlinecoords.push(othersideofearth(feats[solutionarray[i]].getGeometry().getCoordinates()));
                complimentlinecoords.push(feats[solutionarray[i+1]].getGeometry().getCoordinates());

                }
                var line = new ol.geom.LineString(coordArray);
                var feature = new ol.Feature({
                    geometry: line
                });
                map.soluSource.addFeature(feature);
                if(complimentlinecoords){
                    var line2 = new ol.geom.LineString(complimentlinecoords);
                    var feature2 = new ol.Feature({
                        geometry: line2
                    });
                    map.soluSource.addFeature(feature2);
                }
            }
            
            map.soluLayer.setExtent([-20026376.39,-20048966.10,20026376.39,20048966.10]);
            console.log(map.soluLayer.getExtent());
            map.soluSource.changed();
        };

        map.draw; // global so we can remove it later
        function addInteraction() {
            map.draw = new ol.interaction.Draw({
                source: map.pointsource,
                type: "Point"//** @type {ol.geom.GeometryType} */ (typeSelect.value)
            });
            map.olmap.addInteraction(map.draw);
        }

        map.olmap.on('click', function (evt) {
            //var feats = featureOverlay.getFeaturesAtCoordinate(evt.coordinate)
        });

        addInteraction();
        $("#createGenetic").button().click(function (e) {
            map.freshPop = true;
            map.universe = ENCOG.GUI.TSP.create();
            map.universe.reset();
            map.genetic = new ENCOG.Genetic.create();

            map.genetic.crossover = function performCrossover(motherArray, fatherArray, child1Array, child2Array)
            {
                // the chromosome must be cut at two positions, determine them
                var cutLength = motherArray.length / 5;
                var cutpoint1 = Math.floor(Math.random() * (motherArray.length - cutLength));
                var cutpoint2 = cutpoint1 + cutLength;
                // keep track of which genes have been taken in each of the two
                // offspring, defaults to false.
                var taken1 = {};
                var taken2 = {};
                // handle cut section
                for (var i = 0; i < motherArray.length; i++)
                {
                    if (!((i < cutpoint1) || (i > cutpoint2)))
                    {
                        child1Array[i] = fatherArray[i];
                        child2Array[i] = motherArray[i];
                        taken1[fatherArray[i]] = true;
                        taken2[motherArray[i]] = true;
                    }
                }
                // handle outer sections
                for (var i = 0; i < motherArray.length; i++)
                {
                    if ((i < cutpoint1) || (i > cutpoint2))
                    {
                        child1Array[i] = getNotTaken(motherArray, taken1);
                        child2Array[i] = getNotTaken(fatherArray, taken2);
                    }
                }
            };
            map.genetic.mutate = function performMutation(data)
            {
                var iswap1 = Math.floor(Math.random() * data.length);
                var iswap2 = Math.floor(Math.random() * data.length);
                // can't be equal
                if (iswap1 == iswap2)
                {
                    // move to the next, but
                    // don't go out of bounds
                    if (iswap1 > 0)
                    {
                        iswap1--;
                    } else {
                        iswap1++;
                    }
                }
                var t = data[iswap1];
                data[iswap1] = data[iswap2];
                data[iswap2] = t;
            }
            map.genetic.scoreSolution = function (path) {
                return map.universe.calculatePathLength(path);
            };
            map.genetic.createPopulation(1000, function ()
            {
                return map.universe.generatePath();
            });


            map.genetic.iteration();
            var solution = map.genetic.getSolution();
            map.addsolution(solution);
            $("#solutionDist").text(map.universe.calculatePathLength(solution).toFixed(4));
            $("#animate").prop('disabled',false);
            

            // alert("!");




        });
        $("#clear-restart").button().click(function () {
            map.olmap.unByKey(map.renderEventKey);
            numpoints = 0;
            map.pointsource.clear();
            map.pointsource.changed();
            map.soluSource.clear();
            map.soluSource.changed();
            map.genetic = {};
            map.universe = {};
            
        });
        $("#randomPointSpinner").spinner().spinner("value",20);
        $("#addRandPoints").button().click(function(){
            map.addRandomPoints(parseInt($("#randomPointSpinner").spinner("value")));
        });
        $("#animate").button().click(function () {
            $("#animate").prop('disabled',true);
            if(map.freshPop){
            var i = 0; 
            }else{
            var i = map.iterations;
            }
            var startDate = new Date();
            var startTime = startDate.getTime();
            
            map.renderEventKey = map.olmap.on("postcompose", function () {
                map.genetic.iteration();
                i++; 
                $("#totaliterationcounter").text(i);
                var nowDate = new Date();
                var nowTime = nowDate.getTime();
                if(map.lastTime){
                    var deltaiteration = nowTime - map.lastTime;
                    $("#deltaT").text(deltaiteration/1000);
                }
                var timePassed = nowTime - startTime;
                map.lastTime = nowTime
                

                $("#totaltimer").text((timePassed/1000).toFixed(1));
                
                var thisSolution = map.genetic.getSolution();
                // there is a case where the arrays are exactly reversed need to check for this without killing speed
                if (arraysEqual(map.lastsolution, thisSolution)) {
                    map.stableiterations++;
                    map.soluSource.changed();
                } else {
                    map.addsolution(thisSolution);
                     var soloLen = map.universe.calculatePathLength(thisSolution);
                     if(map.lastsolution.solulength){
                         if (soloLen === map.lastsolution.solulength)
                                map.stableiterations++;
                                map.soluSource.changed();
                     }else{
                         var formattedSolLen = soloLen.toFixed(4);
                         $("#solutionDist").text(formattedSolLen);
                         map.stableiterations = 0;
                     }
                     map.lastsolution.solulength = soloLen;
                     
                }
                if (map.stableiterations > 49) {
                    map.olmap.unByKey(map.renderEventKey);
                    map.iterations = i;
                    $("#animate").prop('disabled',false);
                }
                $("#iterationcounter").text(map.stableiterations);
                map.lastsolution = thisSolution;
            });
            map.stableiterations = 0;
            map.genetic.iteration();
            var thisSolution = map.genetic.getSolution();
            map.addsolution(thisSolution);
            map.lastsolution = map.universe.calculatePathLength(thisSolution);
            map.freshPop = false;
        }).prop('disabled',true);
    

    }
    return map;
}($);