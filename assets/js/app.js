var svgHeight = 600;
var svgWidth = 1000;
var margin = {
	top: 50,
	right: 50,
	bottom: 50,
	left: 50
};
var chartHeight = svgHeight - margin.top - margin.bottom;
var chartWidth = svgWidth - margin.left - margin.right;

var svg = d3.select('#scatter').append('svg')
.attr('width', svgWidth)
.attr('height', svgHeight);
var chartGroup = svg.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);

var total_data = [];
var state = [];
var abbr = [];

var chosenX;
var chosenY;
var xScale;
var yScale;
var xAxis;
var yAxis;

var nodes;
var xLabel;
var yLabel;

function init() {
	d3.csv('./assets/data/data.csv').then(function(statedata) {
		//we list our data for our dropdown menus
		d3.select('#selectX').selectAll('option')
		.data(Object.keys(statedata[0]))
		.enter()
		.append('option')
		.attr('value', function(d) {return d;})
		.text(function(d) {return d;});

		d3.select('#selectY').selectAll('option')
		.data(Object.keys(statedata[0]))
		.enter()
		.append('option')
		.attr('value', function(d) {return d;})
		.text(function(d) {return d;});

		//now we parse our data
		statedata.forEach(function(data) {
			for (var key in data) {
				total_data.push(data);
				if ((key != 'state') && (key != 'abbr')) {
					//I'm going to let the -0.385218228 column be 0 for everything
					data[key] = +data[key];
				}
				else if (key == 'state') {
					state.push(data[key]);
				}
				else {
					abbr.push(data[key]);
				}
			}
		});
		
		chosenX = 'poverty';
		chosenY = 'age';
		//create the axes
		var xScale = scale(statedata, chosenX, 'x');
		var yScale = scale(statedata, chosenY, 'y');

		var bottomAxis = d3.axisBottom(xScale);
		var leftAxis = d3.axisLeft(yScale);

		xAxis = chartGroup.append("g")
		.classed("x-axis", true)
		.attr("transform", `translate(0, ${chartHeight})`)
		.call(bottomAxis);
		yAxis = chartGroup.append("g")
		.call(leftAxis);


		//create circles with labels
		nodes = chartGroup.append("g")
		.selectAll("circle")
		.data(total_data)
		.enter()
		.append("g")
		.attr("transform", function(d) {
			d.x = xScale(d[chosenX]);
			d.y = yScale(d[chosenY]);
			return "translate (" + d.x + ',' + d.y + ')';
		});
		nodes.append('circle')
		.attr('r',10)
		.attr('stroke','white')
		.attr('fill','skyblue')
		.attr("opacity", "0.5");
		nodes.append('text')
		.attr('text-anchor','middle')
		.attr('y','.3em')
		.attr('font-family', 'Times New Roman')
		.attr('font-size', '10px')
		.text(d => d['abbr']);


		//create axis labels
		xLabel = chartGroup.append("text")
		.attr("x", chartWidth/2)
		.attr("y", chartHeight + 40)
		.attr("value", "xaxis")
		.text(chosenX);

		yLabel = chartGroup.append("text")
		.attr("transform", "rotate(-90)")
		.attr("x", 0-(chartHeight/2))
		.attr("y", 0-margin.left)
		.attr("dy", "1em")
		.attr("value", "yaxis")
		.text(chosenY);


		//create tooltips
		nodes = tooltips(nodes, chosenX, chosenY);
	});
}

//-------------------------------------------------------------------------------------------------------

function optionChangedX(variable) {
	if (variable != chosenX) {
		chosenX = variable;
		newXaxis = scale(total_data, chosenX, 'x');

		var bottomAxis = d3.axisBottom(newXaxis, xAxis)
		xAxis.transition()
		.duration(1000)
		.call(bottomAxis);

		nodes.transition()
		.duration(1000)
		.attr("transform", function(d) {
			d.x = newXaxis(d[chosenX]);
			return "translate (" + d.x + ',' + d.y + ')';
		});

		xLabel['_groups'][0][0].innerHTML = variable;
		tooltips(nodes, chosenX, chosenY);
	}
}
function optionChangedY(variable) {
	if (variable != chosenY) {
		chosenY = variable;
		newYaxis = scale(total_data, chosenY, 'y');

		var leftAxis = d3.axisLeft(newYaxis, yAxis)
		yAxis.transition()
		.duration(1000)
		.call(leftAxis);

		nodes.transition()
		.duration(1000)
		.attr("transform", function(d) {
			d.y = newYaxis(d[chosenY]);
			return "translate (" + d.x + ',' + d.y + ')';
		});

		yLabel['_groups'][0][0].innerHTML = variable;
		tooltips(nodes, chosenX, chosenY);
	}
}
//-------------------------------------------------------------------------------------------------------

function scale(statedata, variable, x_or_y) {
	if ((variable != 'state') && (variable != 'abbr') && (variable != '-0.385218228')) {
		if (x_or_y == 'x') {
			var linearScale = d3.scaleLinear()
			.domain([d3.min(statedata, d => d[variable]) * 0.8, d3.max(statedata, d => d[variable]) * 1.2])
			.range([0, chartWidth]);
		}
		else if (x_or_y == 'y') {
			var linearScale = d3.scaleLinear()
			.domain([d3.min(statedata, d => d[variable]) * 0.8, d3.max(statedata, d => d[variable]) * 1.2])
			.range([chartHeight, 0]);
		}
		return linearScale;
	}
	else if (variable == 'state') {
		if (x_or_y == 'x') {
			var numarray = Array.from(Array(state.length).keys());
			numarray.forEach(function(num, index, arr) {
				arr[index] = num*chartWidth/(state.length-1);
			});
			var ordinalScale = d3.scaleOrdinal()
			.domain(state)
			.range(numarray);
		}
		else if (x_or_y == 'y') {
			var numarray = Array.from(Array(state.length).keys());
			numarray.forEach(function(num, index, arr) {
				arr[index] = num*chartHeight/(state.length-1);
			});
			numarray.reverse();
			var ordinalScale = d3.scaleOrdinal()
			.domain(state)
			.range(numarray);
		}
		return ordinalScale;
	}
	else if (variable == 'abbr') {
		if (x_or_y == 'x') {
			var numarray = Array.from(Array(abbr.length).keys());
			numarray.forEach(function(num, index, arr) {
				arr[index] = num*chartWidth/(abbr.length-1);
			});
			var ordinalScale = d3.scaleOrdinal()
			.domain(abbr)
			.range(numarray);
		}
		else if (x_or_y == 'y') {
			var numarray = Array.from(Array(abbr.length).keys());
			numarray.forEach(function(num, index, arr) {
				arr[index] = num*chartHeight/(abbr.length-1);
			});
			numarray.reverse();
			var ordinalScale = d3.scaleOrdinal()
			.domain(abbr)
			.range(abbr);
		}
		return ordinalScale;
	}
	else {
		if (x_or_y == 'x') {
			var linearScale = d3.scaleLinear()
			.domain([-10, 10])
			.range([0, chartWidth]);
		}
		else if (x_or_y == 'y'){
			var linearScale = d3.scaleLinear()
			.domain([-10,10])
			.range([chartHeight, 0]);
		}
		return linearScale;
	}
}

//-------------------------------------------------------------------------------------------------------

function tooltips(nodes, chosenX, chosenY) {
	var toolTip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([0, 50])
	.html(function(d){
		return (`${chosenX}: ${d[chosenX]}<br>${chosenY}: ${d[chosenY]}`);
	});

	nodes.call(toolTip);

	nodes.on("mouseover", function(data) {
		toolTip.show(data);
	})
	.on("mouseout", function(data, index) {
		toolTip.hide(data);
	});

	return nodes;
}


init();