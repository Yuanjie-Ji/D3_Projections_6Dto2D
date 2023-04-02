/* Server Connection Section */

// initilize xhr
var xhr = null;

// connect to server and get callback
function connectServer() {
    console.log("Get users...");
    if (!xhr) {
        // Create a new XMLHttpRequest object 
        xhr = new XMLHttpRequest();
    }
    xhr.onreadystatechange = dataCallback;

    // asynchronous requests
    xhr.open("GET", "http://localhost:6969/confusionMatrix", true);

    // Send the request to the server, this is needed even if nothing is sent in this case
    xhr.send(null);
}

function dataCallback() {
    // Check response is ready or not
    if (xhr.readyState == 4 && xhr.status == 200) {
        console.log("User data received!");
        // get response data
        predictionData = JSON.parse(xhr.responseText)[0]
        happinessData = JSON.parse(xhr.responseText)[1]
        confusionMatrix = JSON.parse(xhr.responseText)[2]
        project_result = JSON.parse(xhr.responseText)[3]
        // draw scatterplot and confusion matrix
        console.log(predictionData)
        draw_scatterplots(happinessData, predictionData, confusionMatrix, project_result)
    }
}

/* Draw Scatter Plot Section*/

// Defining size variables for the SVGs
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom,
    miniWidth = 230 - margin.left - margin.right,
    miniHeight = 150 - margin.top - margin.bottom;
    

function draw_scatterplots(happinessData, predictionData, confusionMatrix, project_result) {
    // Loading data
    console.log(happinessData)
    var pcaData = project_result[0]
    var mdsData = project_result[1]
    var tsneData = project_result[2]
    var umapData = project_result[3]

    // Choose the initial dimensions that we are rendering
    var possibleDimensions = Object.keys(happinessData[Object.keys(happinessData)[0]])
    var xDim = possibleDimensions[0];
    var yDim = possibleDimensions[1];

    // Store possible choices for projections
    var projectionOptions = ['axis_aligned', 'pca', 'mds', 'tsne', 'umap']
    var currProjectionOption = 'axis_aligned'

    // Initialize the scales and axes
    var xScale = d3.scaleLinear().range([0, width]),
        xAxis = d3.axisBottom().scale(xScale).ticks(5),
        miniXScale = d3.scaleLinear().range([0, miniWidth]),
        miniXAxis = d3.axisBottom().scale(miniXScale).ticks(5);

    var yScale = d3.scaleLinear().range([height, 0]),
        yAxis = d3.axisRight().scale(yScale).ticks(5),
        miniYScale = d3.scaleLinear().range([miniHeight, 0]),
        miniYAxis = d3.axisRight().scale(miniYScale).ticks(5);

    // Initialize Projections
    initializeProjections()
    
    // Fill in the possible dimensions into the select lists
    initializeScales()

    // Initialize each model container
    var modelContainers = initializeModels();

    // draw scatter plot in model containers
    redrawScatterplots(modelContainers);

    // draw confusion model in model containers
    drawConfusionMatrices(modelContainers);

    function buildScatterPlot(containerElement, data, modelPredictions, groundTruth, fullData) {
        var svgWidth, svgHeight, scatterXScale, scatterXAxis, scatterYScale, scatterYAxis;
        console.log("model predictions: " + modelPredictions)
        if (modelPredictions.length === 0) {
            // scatter plot is for the whole dataset
            svgWidth = width;
            svgHeight = height;
            scatterXScale = xScale;
            scatterXAxis = xAxis;
            scatterYScale = yScale;
            scatterYAxis = yAxis;
        } else {
            // scatter plot is for a particular model
            svgWidth = miniWidth;
            svgHeight = miniHeight;
            scatterXScale = miniXScale;
            scatterXAxis = miniXAxis;
            scatterYScale = miniYScale;
            scatterYAxis = miniYAxis;
        }

        // HINT: If you need to have a div floating around, like, say,
        // for a tooltip, you can append it to this container:
        var scatterContainer = d3.select(containerElement)
        var tooltip = scatterContainer
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        // We destroy any existing SVGs since we're going to rebuild it.
        scatterContainer.select('svg').remove()

        // Add the svg
        svg = d3.select(containerElement)
            .append('svg')

        svg.attr("width", svgWidth + margin.left + margin.right)
            .attr("height", svgHeight + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Add the axes
        var xAxisContainer = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + svgHeight + ")")
            .call(scatterXAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", svgWidth)
                .attr("y", -6)
                .style("text-anchor", "end");

        // y-axis
        var yAxisContainer = svg.append("g")
            .attr("class", "y axis")
            .call(scatterYAxis)
                .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 18)
                .attr("dy", ".71em")
                .style("text-anchor", "end");
        if (currProjectionOption === 'axis_aligned') {
            xAxisContainer.text(xDim)
            yAxisContainer.text(yDim)
        }

        // TODO: determine the dot style
        function determineDotShape(d){
            if(groundTruth[d["id"]] == 1) return d3.symbol().type(d3.symbolCross)()
            else return d3.symbol().type(d3.symbolCircle)()
        }

        // TODO: determine the storke color
        function determineStrokeColor(d) {
            if(containerElement == '#dataset-svg') return 'black'
            else if(modelPredictions[d["id"]] == groundTruth[d["id"]]) return 'green'
            else return 'red'
        }

        // draw dots into the scatterplot
        svg.selectAll(".dot")
            .data(data)
            .enter().append("path")
                .attr("class", "dot")
                .attr("r", 2.5)
                .attr('fill', 'none')
                .attr('stroke', 'blue')
                .attr('d', determineDotShape)
                .attr('stroke', determineStrokeColor)
                .attr('transform', (d) => 'translate(' + scatterXScale(d.x) + ', ' + scatterYScale(d.y) + ')')

            // TODO: mouseover event
            // .on("mouseover", function(e, d) {
            // })

            // TODO: mouseout event
            // .on("mouseout", function(e, d) {
            // });


            .on("mouseover", function(d) {
                // Show tooltip on mouseover
                tooltip.transition()
                  .duration(200)
                  .style("opacity", 0.9);
                tooltip.text(possibleDimensions[0] +": " + fullData[d3.select(this).datum().id][possibleDimensions[0]] +"\n" +
                  possibleDimensions[1] +": "+ fullData[d3.select(this).datum().id][possibleDimensions[1]] +"\n" +
                  possibleDimensions[2] + ": " + fullData[d3.select(this).datum().id][possibleDimensions[2]] + "\n"+
                  possibleDimensions[3] + ": " + fullData[d3.select(this).datum().id][possibleDimensions[3]] + "\n" +
                  possibleDimensions[4] + ": " + fullData[d3.select(this).datum().id][possibleDimensions[4]] + "\n" +
                  possibleDimensions[5] + ": " + fullData[d3.select(this).datum().id][possibleDimensions[5]])
                  .style("left", (d3.pageX + 10) + "px")
                  .style("top", (d3.pageY - 100) + "px");
              })
              .on("mouseout", function(d) {
                // Hide tooltip on mouseout
                tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
              });
    }
    /* END SCATTERPLOT CODE */


    /* CONFUSION MATRIX CODE - YOU WILL NEED TO CHANGE THIS */
    function buildConfusionMatrix(containerElement, confusionMatrix) {
        // console.log(confusionMatrix)
        // Code below makes the confusion matrix
        var table = d3.select(containerElement).append('table')
                        .attr('class', 'confusion-matrix-table')
        

        // Creating the other cells of the table
        table.append('tr').html('<td/><td/><td>ground</td><td>truth</td>')
        table.append('tr').html('<td/><td/><td>T</td><td>N</td>')
        predictedTrueRow = table.append('tr').html('<td>Predicted</td><td>T</td>')
        predictedFalseRow = table.append('tr').html('<td></td><td>N</td>')

        // TODO: filling in the values
        var truePositives = confusionMatrix["truePositive"];
        var trueNegatives = confusionMatrix["trueNegative"];
        var falsePositives = confusionMatrix["falsePositive"];
        var falseNegatives = confusionMatrix["falseNegative"];
  

        predictedTrueRow.append('td')
                        .attr('class', 'innerMatrix')
                        .text(truePositives)

        predictedTrueRow.append('td')
                        .attr('class', 'innerMatrix')
                        .text(falsePositives)

        predictedFalseRow.append('td')
                        .attr('class', 'innerMatrix')
                        .text(falseNegatives)

        predictedFalseRow.append('td')
                        .attr('class', 'innerMatrix')
                        .text(trueNegatives)
    }
    /* END CONFUSION MATRIX CODE */

    /* BEGIN SUPPORT CODE */
    function initializeProjections() {
        var optionSlots = d3.select('#projection-select')
            .selectAll('div.proj')
            .data(projectionOptions)
            .enter()
            .append('div')

        optionSlots
                .append('input')
                .attr('type', 'radio')
                .attr('name', 'projection')
                .attr('value', (d) => d)
                .property("checked", function(d){ return d === currProjectionOption; })

        optionSlots
                .append('label')
                .attr('for', (d) => d)
                .text((d) => d)

        // TODO: on change event
        // HINT: what is supposed to happen after you change the index
        // what variable(variables) is supposed to change
        // and what function(functoins) is supposed to be called

        d3.selectAll("input[name = 'projection']").on("change", function (d){
            console.log("projection has been changed to ", d3.select(this).property("value"))
            currProjectionOption = d3.select(this).property("value")
            redrawScatterplots(modelContainers);
        })

    }
    function initializeScales() {
        // Fill in the possible dimensions into the select lists
        d3.select('#x-axis-select')
            .selectAll('option')
            .data(possibleDimensions)
            .enter()
                .append('option')
                .text((d) => d)
                .attr('value', (d,i) => i)
                .property("selected", function(d){ return d === xDim; })

        d3.select('#y-axis-select')
            .selectAll('option')
            .data(possibleDimensions)
            .enter()
                .append('option')
                .text((d) => d)
                .attr('value', (d,i) => i)
                .property("selected", function(d){ return d === yDim; })

        
        // TODO: onchange event
        d3.select("#x-axis-select").on("change", function(d) {
            xDim = possibleDimensions[d3.select("#x-axis-select").property("value")]
            redrawScatterplots(modelContainers)
        })

        d3.select("#y-axis-select").on("change", function(d) {
            yDim = possibleDimensions[d3.select("#y-axis-select").property("value")]
            redrawScatterplots(modelContainers)
        })

    }
    
    function calculateScales(scatterplotData) {
        if (currProjectionOption === 'axis_aligned') {
            xScale.domain([-0.5, 5.5])
            yScale.domain([-0.5, 5.5])
            miniXScale.domain([-0.5, 5.5])
            miniYScale.domain([-0.5, 5.5])
        } else {
            // TODO: set up domain when current projection option is not axis_aligned

            var x_axis_min = d3.min(scatterplotData, function(d) { return d.x; })
            var x_axis_max = d3.max(scatterplotData, function(d) { return d.x; })

            var y_axis_min = d3.min(scatterplotData, function(d) { return d.y; })
            var y_axis_max = d3.max(scatterplotData, function(d) { return d.y; })

            xScale.domain([x_axis_min, x_axis_max])
            yScale.domain([y_axis_min, y_axis_max])
            miniXScale.domain([x_axis_min, x_axis_max])
            miniYScale.domain([y_axis_min, y_axis_max])

            xScale.nice()
            yScale.nice()
            miniXScale.nice()
            miniYScale.nice()
        }
    }

    function initializeModels() {
        console.log("initializing models, there should be data ", Object.keys(predictionData))
        d3.select('.models-container ul')
        .selectAll('li')
        .data(Object.keys(predictionData).filter((k) => k !== 'ground_truth')).enter()
            .append('li')
            .attr('class', 'model-li')
            .attr('id', (d) => d.replace(/ /g,"-"))
            .html((d) => '<h2>' + d + '</h2>')
                .append('div')
                .attr('class', 'model-confusion-matrix')
                .attr('id', (d) => 'model-confusion-matrix-' + d.replace(/ /g,"-"))
    
    return Object.keys(predictionData)
    }

    function parseData(data) {
        // We need to add some random jitter because there are so few points
        epsilon = 0.4

        // Different accessor functions based on if it's axis-aligned or not
        var projAccessor = function (k) {
            var projData;
            if (currProjectionOption === 'pca') {
                projData = pcaData;
            } else if (currProjectionOption === 'mds') {
                projData = mdsData;
            } else if (currProjectionOption === 'tsne') {
                projData = tsneData;
            } else if(currProjectionOption == 'umap'){
                projData = umapData
            }
            return {id: parseInt(k), x: parseFloat(projData[k]['x']), y: parseFloat(projData[k]['y'])}
        }

        var axisAlignedAccessor = function(k) { return {id: parseInt(k), x: data[k][xDim] + ((0.5 - Math.random()) * epsilon), y: data[k][yDim] + ((0.5 - Math.random()) * epsilon)} }

        var scatterplotData;
        if (currProjectionOption === 'axis_aligned') {
            scatterplotData = Object.keys(data).map(axisAlignedAccessor)
        } else {
            scatterplotData = Object.keys(data).map(projAccessor)
        }
        console.log(scatterplotData)
        return scatterplotData;
    }

    function redrawScatterplots(modelContainers) {
        scatterplotData = parseData(happinessData)
        console.log(JSON.stringify(predictionData))
        calculateScales(scatterplotData);
        // Render the data svg
        buildScatterPlot('#dataset-svg', scatterplotData, [], predictionData['ground_truth'], happinessData)

        modelContainers.forEach((c) => { 
            // alert(JSON.stringify(predictionData[c])); 
            buildScatterPlot('#' + c.replace(/ /g,"-"), scatterplotData, predictionData[c], predictionData['ground_truth'], happinessData) } );
    }

    function drawConfusionMatrices(modelContainers) {
        modelContainers.forEach((c) => { buildConfusionMatrix('#model-confusion-matrix-' + c.replace(/ /g,"-"), confusionMatrix[c]) });
    }
}