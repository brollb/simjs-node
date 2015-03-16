/** Statistics
 * 
 */

/** DataSeries
 * 
 * Mean and variance algorithm from Wikipedia
 * http://en.wikipedia.org/wiki/Standard_deviation#Rapid_calculation_methods
 */

DataSeries = function (name) {
	this.name = name;
	this.reset();
};

DataSeries.prototype.reset = function () {
	this.Count = 0;
	this.W = 0.0;
	this.A = 0.0;
	this.Q = 0.0;
	this.Max = -Infinity;
	this.Min = Infinity;
	this.Sum = 0;
	
	if (this.histogram) {
		for (var i = 0; i < this.histogram.length; i++) {
			this.histogram[i] = 0;
		}
	}
};

DataSeries.prototype.setHistogram = function (lower, upper, nbuckets) {
	ARG_CHECK(arguments, 3, 3);
	
	this.hLower = lower;
	this.hUpper = upper;
	this.hBucketSize = (upper - lower) / nbuckets;
	this.histogram = new Array(nbuckets + 2);
	for (var i = 0; i < this.histogram.length; i++) {
		this.histogram[i] = 0;
	}
};

DataSeries.prototype.getHistogram = function () {
	return this.histogram;
};

DataSeries.prototype.record = function (value, weight) {
	ARG_CHECK(arguments, 1, 2);
	
	var w = (weight === undefined) ? 1 : weight;
	//document.write("Data series recording " + value + " (weight = " + w + ")\n");

	if (value > this.Max) this.Max = value;
	if (value < this.Min) this.Min = value;
	this.Sum += value;
	this.Count ++;
	if (this.histogram) {
		if (value < this.hLower) { 
			this.histogram[0] += w; 
		}
		else if (value > this.hUpper) { 
			this.histogram[this.histogram.length - 1] += w;
		} else {
			var index = Math.floor((value - this.hLower) / this.hBucketSize) + 1;
			this.histogram[index] += w;
		}
	}
	
	// Wi = Wi-1 + wi
	this.W = this.W + w;  
	
	if (this.W === 0) {
		return;
	}
	
	// Ai = Ai-1 + wi/Wi * (xi - Ai-1)
	var lastA = this.A;
	this.A = lastA + (w / this.W) * (value - lastA);
	
	// Qi = Qi-1 + wi(xi - Ai-1)(xi - Ai)
	this.Q = this.Q + w * (value - lastA) * (value - this.A);
	//print("\tW=" + this.W + " A=" + this.A + " Q=" + this.Q + "\n");
};

DataSeries.prototype.count = function () {
	return this.Count;
};

DataSeries.prototype.min = function () {
	return this.Min;
};

DataSeries.prototype.max = function () {
	return this.Max;
};

DataSeries.prototype.range = function () {
	return this.Max - this.Min;
};

DataSeries.prototype.sum = function () {
	return this.Sum;
};

DataSeries.prototype.sumWeighted = function () {
	return this.A * this.W;
};

DataSeries.prototype.average = function () {
	return this.A;
};

DataSeries.prototype.variance = function () {
	return this.Q / this.W;
};

DataSeries.prototype.deviation = function () {
	return Math.sqrt(this.variance());
};


/** Time series
 * 
 */
TimeSeries = function (name) {
	this.dataSeries = new DataSeries(name);
};

TimeSeries.prototype.reset = function () {
	this.dataSeries.reset();
	this.lastValue = NaN;
	this.lastTimestamp = NaN;
};

TimeSeries.prototype.setHistogram = function (lower, upper, nbuckets) {
	ARG_CHECK(arguments, 3, 3);
	this.dataSeries.setHistogram(lower, upper, nbuckets);
};

TimeSeries.prototype.getHistogram = function () {
	return this.dataSeries.getHistogram();
};

TimeSeries.prototype.record = function (value, timestamp) {
	ARG_CHECK(arguments, 2, 2);
	
	if (!isNaN(this.lastTimestamp)) {
		this.dataSeries.record(this.lastValue, timestamp - this.lastTimestamp);
	}
	
	this.lastValue = value;
	this.lastTimestamp = timestamp;
};

TimeSeries.prototype.finalize = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.record(NaN, timestamp);
};

TimeSeries.prototype.count = function () {
	return this.dataSeries.count();
};

TimeSeries.prototype.min = function () {
	return this.dataSeries.min();
};

TimeSeries.prototype.max = function () {
	return this.dataSeries.max();
};

TimeSeries.prototype.range = function () {
	return this.dataSeries.range();
};

TimeSeries.prototype.sum = function () {
	return this.dataSeries.sum();
};

TimeSeries.prototype.average = function () {
	return this.dataSeries.average();
};

TimeSeries.prototype.deviation = function () {
	return this.dataSeries.deviation();
};

TimeSeries.prototype.variance = function () {
	return this.dataSeries.variance();
};

/** Population 
 * 
 */

Population = function (name) {
	this.name = name;
	this.population = 0;
	this.sizeSeries = new TimeSeries();
	this.durationSeries = new DataSeries();
};

Population.prototype.reset = function () {
	this.sizeSeries.reset();
	this.durationSeries.reset();
	this.population = 0;
};

Population.prototype.enter = function (timestamp) {
	ARG_CHECK(arguments, 1, 1);
	
	this.population ++;
	this.sizeSeries.record(this.population, timestamp);
};

Population.prototype.leave = function (arrivalAt, leftAt) {
	ARG_CHECK(arguments, 2, 2);
	
	this.population --;
	this.sizeSeries.record(this.population, leftAt);
	this.durationSeries.record(leftAt - arrivalAt);
};

Population.prototype.current = function () {
	return this.population;
};

Population.prototype.finalize = function (timestamp) {
	this.sizeSeries.finalize(timestamp);
};

module.exports = {
    Population: Population,
    DataSeries: DataSeries,
    TimeSeries: TimeSeries
};
