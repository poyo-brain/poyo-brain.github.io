// create a data source to hold data
const source = new Bokeh.ColumnDataSource({
    data: { x: [], y: [] }
});

// make a plot with some tools
const plot = Bokeh.Plotting.figure({
    title: 'Example of random data',
    height: 300,
    width: 300
});

// add a line with data from the source
plot.line({ field: "x" }, { field: "y" }, {
    source: source,
    line_width: 2
});

plot.toolbar.logo = null
plot.toolbar_location = null

// show the plot, appending it to the end of the current section
Bokeh.Plotting.show(plot, "#finetune-vis-plot1");

function addPoint() {
    // add data --- all fields must be the same length.
    source.data.x.push(Math.random())
    source.data.y.push(Math.random())

    // update the data source with local changes
    source.change.emit()
}

const container = document.getElementById("finetune-visual");
const addDataButton = document.createElement("Button");
addDataButton.appendChild(document.createTextNode("Some data."));
container.appendChild(addDataButton);
addDataButton.addEventListener("click", addPoint);

addPoint();
addPoint();

