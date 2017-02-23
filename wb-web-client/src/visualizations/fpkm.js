import { importLazy } from '../components/LazilyLoad';
import jQuery from 'jquery';
const $jq = jQuery.noConflict();

// summary plot using selected modENCODE experiments
function makeFpkmSummaryPlot(container, experiments, data){
  const HighchartsPromise = importLazy(import('../../legacy_modules/js/highcharts/4.1.9/highcharts.js'), {globalName: 'Highcharts'})
    .then(() => importLazy(import('../../legacy_modules/js/highcharts/4.1.9/highcharts-more.js'), {globalName: 'Highcharts'}));
  const ssPromise = importLazy(import('../../legacy_modules/js/simple-statistics/1.0.1/simple_statistics.min.js'), {globalName: 'ss'});

  Promise.all([HighchartsPromise, ssPromise]).then(([Highcharts, ss]) => {

    var CATEGORICAL_STAGES_PARTITIONED = [
      ['EE', 'LE', 'L1', 'L2', 'L3', 'L4', 'YA'],
      ['Male EM', 'Male L4'],
      ['Soma L4'],
      ['Dauer entry', 'Dauer', 'Dauer exit']];
    var CATEGORICAL_STAGES = CATEGORICAL_STAGES_PARTITIONED.reduce(function(prev, stagesInPartition){
      return prev.concat(stagesInPartition);
    }, []);
    var STAGES_TYPES = [
      'Embryonic time series (minutes)',
      'Classical stages',
      'Male',
      'Soma',
      'Dauer stages'];
    var MIN_CATEGORICAL = 850;
    var STEP = 100;
    var BIG_STEP= 150;

    var LABEL_COLOR = '#000000';

    function update(){
      var cleanData = preprocess_data(experiments, data);
      if (cleanData.length < 1){
        $jq(container).html('<span class="caveat-emptor" style="position:relative;top:1.5em;">There is no FPKM expression data for this gene from the selected modENCODE libraries.</span>');
        return;
      }

      var lifeStage2Data = cleanData.reduce(function(prev, d){
        var lifeStage = bin(d.lifeStage);
        var dat = prev[lifeStage] || [];
        prev[lifeStage] = dat.concat(d);
        return prev;
      }, {});
      var sortedByLifeStage = Object.keys(lifeStage2Data).slice()
        .sort(function(lifeStageA,lifeStageB){
          return lifeStageA - lifeStageB;
        })
        .map(function(lifeStage){
          return lifeStage2Data[lifeStage];
        });

      container.highcharts({
        chart: {
          height: 500,
          width: 850,
          marginBottom: 150
        },
        title: {
          text: '' //'FPKM expression data from selected modENCODE libraries'
        },
        subtitle: {
          text: 'This shows the FPKM expression values of PolyA+ and Ribozero modENCODE libraries across life-stages. The bars show the median value of the libraries plotted. Other modENCODE libraries which were made using other protocols or which are from a particular tissue or attack by a pathogen have been excluded.',
          style: {
            color: LABEL_COLOR,
            "font-size": "10px"
          },
          verticalAlign: 'bottom',
          x: 20,
          y: -60,
          floating: true
        },
        series: [{
          name: 'Median',  // only includes the numerical stages
          type: 'column',
          //color: '#beaed4',
          color: 'rgba(189,189,189, 1)',
          data: sortedByLifeStage
            .filter(function(dat){
              // keep only the numerical lifestages
              return !isNaN(Number(dat[0].lifeStage));
            })
            .map(function(dat){
              var values = dat.map(function(d){
                return d.value;
              });
              return [bin(dat[0].lifeStage), ss.median(values)];
            }),
        },{
          name: 'Median (categorical)',  //I need to separate these data out, cuz Gary Williams want a wider bar for them.
          type: 'column',
          pointWidth: 20,
          showInLegend: false,
          //color: '#beaed4',
          color: 'rgba(189,189,189, 1)',
          data: sortedByLifeStage
            .filter(function(dat){
              // keep only the NON-numerical lifestages
              return isNaN(Number(dat[0].lifeStage));
            })
            .map(function(dat){
              var values = dat.map(function(d){
                return d.value;
              });
              return [bin(dat[0].lifeStage), ss.median(values)];
            }),
        },{
          name: 'polyA+',
          type: 'scatter',
          //color: '#f7a35c',
          color:  'rgba(77, 175, 74, 1)',
          marker: {
            radius: 3
          },
          data: pointSeries(sortedByLifeStage, 'polyA')
        },{
          name: 'ribozero',
          type: 'scatter',
          //color: '#4daf4a',
          color: 'rgba(84, 39, 143, 0.6)',  // ribozero is drawn on top of polyA, so give it some transparancy
          marker: {
            radius: 3,
          },
          data: pointSeries(sortedByLifeStage, 'ribozero')
        }],
        xAxis: xAxis(),
        yAxis: {
          min: 0,
          title: {
            text: 'Expression (FPKM)',
            style: {
              color: LABEL_COLOR
            }
          },
          labels: {
            style: {
              color: LABEL_COLOR
            }
          }
        },
        tooltip: {
          headerFormat: '<table>',
          pointFormatter: function(){
            var parts = [
              '<tr>',
              '<td style="color:' + this.series.color + ';padding:0;font-weight:bold;">' + this.series.name + ': </td>',
              '<td><b>' + this.y.toFixed(1) + ' (FPKM)</b></td>',
              '</tr>',
              '<tr>',
              '<td style="color:' + this.series.color + ';padding:0">life stage: </td>',
              '<td>' + getLabelFromScale(this.x, 1) + '</td>'
            ];

            return parts.join('');
          },
          footerFormat: '</table>',
          shared: true,
          useHTML: true
        },
        legend: {
          align: 'center',
          verticalAlign: 'top'
        },

        plotOptions: {
          column: {
            grouping: false,
            pointPlacement: 0,
            groupPadding: 0,
            pointPadding: 0,
            borderWidth: 1
          }
        }
      });
    }

    function preprocess_data(experiments, data){
      var selectedData = data.filter(function(d){
        var experimentId = d.project_info.experiment;
        return (d.project_info.id === 'SRP000401' || d.project_info.id === 'RNASeq_Study.SRP000401')
          && experiments[experimentId];
      });

      // compute median for each technical replicates indicated by the library
      // (technical replicates and only them share the same library ID)
      var libraries = selectedData.reduce(function(prev, d){
        var experimentId = d.project_info.experiment;
        var libraryId = experiments[experimentId][2];
        var replicates = prev[libraryId] || [];
        prev[libraryId] = replicates.concat(d);
        return prev;
      }, {});
      var summarized = Object.keys(libraries).map(function(libraryId){
        var replicates = libraries[libraryId];
        var median = ss.median(replicates.map(function(d){
          return Number(d.value);
        }));
        var experimentId = replicates[0].project_info.experiment;
        var lifeStage = experiments[experimentId][0];
        var type = experiments[experimentId][1];

        return {
          value: median,
          lifeStage: lifeStage,
          type: type,
          library: libraryId
        }
      });

      return summarized;
    }

    // scatter plot data, filerType: one of ployA and ribozero
    function pointSeries(sortedByLifeStage, filterType){

      return sortedByLifeStage.reduce(function(prev, dat){
        var results = dat.filter(function(d){
          return d.type === filterType;
        }).map(function(d){
          return [bin(d.lifeStage), d.value];
        });
        return prev.concat(results);
      }, [])
    }

    // get numerical representation of lifestage
    function xScale(lifeStage){
      if (Number(lifeStage) < MIN_CATEGORICAL) {
        var minutes = Number(lifeStage);
        return minutes;
      }else{
        var stepMultiplier, bigStepMultiplier;
        // normal step between stages of the same type
        // big step when stage type changes, such as from numerical to classical

        stepMultiplier = CATEGORICAL_STAGES.indexOf(lifeStage);

        // use the side-effect of the loop to set the bigStepMultipliers
        CATEGORICAL_STAGES_PARTITIONED.some(function(stages, index){
          if (stages.indexOf(lifeStage) !== -1){
            bigStepMultiplier = index;
            return true;
          }
          return false;  //some() function will run more loops
        });

        return MIN_CATEGORICAL
          + STEP * (stepMultiplier - bigStepMultiplier)  //big step is double counted in stepMultiplier, remove them
          + BIG_STEP * (bigStepMultiplier);
      }
    }

    // the reverse of the scale
    // But instead of doing the computation, just use a lookup table and
    var scale2Label;
    function getLabelFromScale(scaleValue, withUnit){
      if (!scale2Label){
        // initialize lookup table, if it's never initialized
        scale2Label = CATEGORICAL_STAGES.reduce(function(prev, label){
          var scale = xScale(label);
          prev[scale] = label;
          return prev;
        }, {});
      }
      var label = scale2Label[scaleValue] || scaleValue;
      if (withUnit && !isNaN(Number(label))){
        return label + ' (minutes)';
      }else{
        return  label;
      }
    }

    // get the bin that the lifestage by binning its numeric value
    function bin(lifeStage){
      if (Number(lifeStage) < MIN_CATEGORICAL) {
        var minutes = Number(lifeStage);
        return Math.floor(minutes/30) * 30;
      }else{
        return xScale(lifeStage);
      }
    }

    // declare how x-axis needs to be drawn
    function xAxis () {
      var tickLabels = [];
      var maxNumericTick = MIN_CATEGORICAL-BIG_STEP;

      for (var tick = 0; tick <= maxNumericTick; tick+=150){
        tickLabels.push(tick);
      }
      tickLabels = tickLabels.concat(CATEGORICAL_STAGES);

      return {
        // tickInterval: STEP,
        tickPositions: tickLabels.map(xScale),
        labels: {
          formatter: function() {
            var label = getLabelFromScale([this.value]);
            return label.toString().split(/\s+/).join('<br/>');
          },
          style: {
            color: LABEL_COLOR,
            'font-size': 10,
            'font-weight': 'bold'
          }
        },
        plotBands: plotBands(),
        title: {
          text: 'Life stages',
          style: {
            color: LABEL_COLOR
          },
          y: 0
        }
      }
    }

    // alternating bands to represent types of lifestages
    function plotBands () {
      var bands = STAGES_TYPES.map(function(typeName, index){
        var palette = ['rgba(68, 170, 213, 0.1)',
                      'rgba(0, 0, 0, 0)'];
        var from, to;
        var padding = BIG_STEP/2;
        if (index === 0){
          // the numeric time stage
          from = 0;
          to = MIN_CATEGORICAL - padding;
        }else{
          var stages = CATEGORICAL_STAGES_PARTITIONED[index-1];
          from = xScale(stages[0]) - padding;
          to = xScale(stages[stages.length -1]) + padding;
        }
        return {
          from: from,
          to: to,
          color: palette[index % 2],
          label: {
            text: typeName,
            style: {
              color: LABEL_COLOR
            }
          }
        };
      });

      return bands;
    }


    // load the libraries and call to make the plot
    (function setup(){
      update();
    })();
  });
}

// box plot for each project
function makeFpkmBoxPlot(container, projects, data){
  const HighchartsPromise = importLazy(import('../../legacy_modules/js/highcharts/4.1.9/highcharts.js'), {globalName: 'Highcharts'})
    .then(() => importLazy(import('../../legacy_modules/js/highcharts/4.1.9/highcharts-more.js'), {globalName: 'Highcharts'}));
  const ssPromise = importLazy(import('../../legacy_modules/js/simple-statistics/1.0.1/simple_statistics.min.js'), {globalName: 'ss'});

  Promise.all([HighchartsPromise, ssPromise]).then(([Highcharts, ss]) => {

    var menuContainer = container.find('.fpkm-plot-menu-container');
    var plotCanvas = container.find('.fpkm-plot-canvas');

    var projectToData = groupBy(function(item){
      return item.project_info.id;
    }, data);


    function setupMenu(projects){
      var listItems = Object.keys(projects).sort(function(a, b) {
        // sort projects by author name
        function getAuthor(projectID) {
          var pattern = /.+\((.+)\)\s*/;
          var matches = (projects[projectID].title || "").match(pattern);
          if (matches) {
            return matches[1];
          } else {
            return '';
          }
        }

        if (getAuthor(a) < getAuthor(b)) {
          return -1;
        } else if (getAuthor(a) > getAuthor(b)) {
          return 1;
        } else {
          return 0;
        }
      }).map(function(projectID, index){
        var project = projects[projectID];
        var className = index === 0 ? 'ui-state-focus' : '';

        return '<li class="' + className
          + '" data-project-id="' + projectID + '">'
          + project.title + '</li>';
      });
      var menuHtml = [].concat('<ul class="plot-menu">', listItems, '</ul>').join('');
      menuContainer.html(menuHtml);
      menuContainer.find('ul').menu();
      menuContainer.find('li').click(function(){
        var selectedItem = $jq(this);
        selectedItem.addClass('ui-state-focus');
        selectedItem.siblings().removeClass('ui-state-focus');
        update();
      });
    }

    function update(){
      var projectID = getSelectedProject();
      updatePlot(projectID);
      updateDescription(projectID);
    }

    function getSelectedProject(){
      return menuContainer.find('li.ui-state-focus').first().attr('data-project-id');
    }

    function updatePlot(projectID){
      var seriesDataRaw = groupBy(function(item){
        return item.life_stage.label;
      }, projectToData[projectID]);
      var categories = Object.keys(seriesDataRaw);

      var allData = categories.map(function(category){
        return seriesDataRaw[category].map(function(item){
          return Number(item.value);
        });
      });

      var minPoints = 2;
      var boxplotData = allData.reduce(function(boxData, categoryData, index){
        if (categoryData.length < minPoints) {
          return boxData;
        }else{
          var boxParams = [].concat(index,  // x
                                    boxSummaryStat(categoryData)) // boxplot stats
          return boxData.concat([boxParams]);
        }
      }, []);

      var boxplotOtherPoints = allData.reduce(function(pointsData, categoryData, index){
        var boxParams = boxSummaryStat(categoryData);
        var otherData = categoryData.length < minPoints ? categoryData
          : categoryData.filter(function(value){
            // ONLY keep the outliers
            return value < boxParams[0] || value > boxParams[4];
          });

        var otherPoints = otherData.map(function(value){
          return [index,  // x
                 value] // y
        });

        return pointsData.concat(otherPoints);
      }, []);

      plotCanvas.highcharts({
        chart: {
          type: 'boxplot'
        },
        title: {
          text: projectID
        },
        xAxis: {
          categories: categories,
          title: {
            text: 'Life stages'
          }
        },
        yAxis: {
          title: {
            text: 'FPKM values'
          }
        },
        series: [
          {
            name: 'fpkm box statistics',
            data: boxplotData
          },
          {
            name: 'Outlier',
            color: Highcharts.getOptions().colors[0],
            type: 'scatter',
            data: boxplotOtherPoints,
            tooltip: {
              pointFormat: 'Observation: {point.y}'
            }
          }
        ],
        legend: {
          enabled: false
        }
      });
    }

    function updateDescription(projectID) {
      var descriptionContainer = container.find(".fpkm-plot-description");
      var projectObject = projects[projectID];
      var newDescription;

      function getLink(tag){
        var linkParts = [].concat('/resources', tag.class, tag.id);
        var link = linkParts.join('/');
        return '<strong><a href="' + link + '">' + tag.label + '</a></strong>';
      }

      newDescription = getLink(projectObject.tag) + '<div class="text-min"><p>'
        + projectObject.description + '</p></div>';
      descriptionContainer.html(newDescription);
      window.WB.formatExpand(descriptionContainer);
    }

    function groupBy(keyFunction, dataArray){
      var groups = {};
      dataArray.forEach(function(currentItem){
        var groupKey = keyFunction(currentItem);
        groups[groupKey] = (groups[groupKey] || []).concat(currentItem);
      });
      return groups;
    }

    function boxSummaryStat(dataArray){
      var quantiles = ss.quantile(dataArray, [0.25, 0.5, 0.75]);
      var q1 = quantiles[0];
      var q3 = quantiles[2];
      var iqr = q3 - q1;
      var lowerBound = q1 - 1.5 * iqr;
      var upperBound = q3 + 1.5 * iqr;

      var whiskerBottom = Math.min.apply(null, dataArray.filter(
        function(dataValue){
          return dataValue >= lowerBound;
        }));
      var whiskerTop = Math.max.apply(null, dataArray.filter(
        function(dataValue){
          return dataValue <= upperBound;
        }));

      return [].concat(whiskerBottom, quantiles, whiskerTop);
    }

    (function setup(){
      setupMenu(projects);
      update();
    })();

  });
}

const FpkmPlots = {
  makeFpkmBoxPlot,
  makeFpkmSummaryPlot
};

export default FpkmPlots;
