window.addEventListener('load', query_vis);

class QueryPlot {
    constructor(data, htmlId, type, field) {
        this.container = document.getElementById(htmlId);
        this.type = type;
        this.field = field;
        let y_range;
        if (type == 0) {
            y_range = [0, 1.5];
        } else {
            y_range = [-1, 1];
        }

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            // x_axis_label: "time",
            // y_axis_label: "",
            x_range: [0, 1],
            y_range: y_range,
            title: htmlId === "query-vis-1" ? "Query timestamps" : field === "x" ? "Vx" : "Vy"  // Add this line
        });
        // this.plot.toolbar_location = null
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.yaxis.major_label_text_font_size = "10px";
        this.plot.xaxis.major_label_text_font_size = "10px";
        this.plot.yaxis.minor_tick_line_color = null;
        this.plot.yaxis.axis_label_standoff = 2;
        this.plot.xaxis.minor_tick_line_color = null;
        this.plot.xaxis.axis_label_standoff = 20;
        // this.plot.toolbar.active_drag = null;
        this.plot.xgrid.grid_line_color = null;
        this.plot.ygrid.grid_line_color = null;
        if (type == 0) {
            this.plot.yaxis.major_label_text_font_size = '0px'; // hides the tick labels
            this.plot.yaxis.major_tick_line_color = null; // hides the tick lines
        }
        
        if (type == 0) {
        // Step 1: Add Tap Tool to your plot.
        let tapTool = new Bokeh.TapTool();
        this.plot.add_tools(tapTool);
        this.plot.toolbar.active_tap = tapTool;

        let resetTool = new Bokeh.ResetTool();
        this.plot.add_tools(resetTool);

        let custom_tools = [tapTool, resetTool];
        this.plot.add_tools(...custom_tools);
        this.plot.toolbar = new Bokeh.Toolbar({ tools: custom_tools });
        } else {
            this.plot.toolbar_location = null
        }
        this.plot.toolbar.logo = null

        // Step 2: Attach an event listener for the tap event.
        if (type == 0) {
            this.plot.on_event('tap', this.handleTap.bind(this));
            this.plot.on_event('reset', this.handleReset.bind(this));
            }
        // this.plot.on_event('tap', this.handleTap.bind(this));
        // this.plot.on_event('reset', this.handleReset.bind(this));

        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.updateData(data);
    }

    updateData(data) {
        // Changes things for new data
        this.data = data
        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: [-1],
                // y ones like x
                y: [1],
            }
        });

        let circleRenderer = this.plot.circle({ field: "x" }, { field: "y" }, {
            source: this.source,
            color: "black",
            size: 5, 
            alpha: 1.0
        });

        // Add segment glyphs connecting each point to y=0
        this.plot.segment({ field: "x" }, 0, { field: "x" }, { field: "y" }, {
        source: this.source,
        line_color: "black",
        line_width: 2
    });
    }

    handleTap(event) {
        const tappedX = event.x;
        const closest = this.findClosestTimestamp(tappedX);
        
        // Push new data into the source.
        this.source.data.x.push(closest.timestamp);
        if (this.type  == 0) {
            this.source.data.y.push(1.0);
        } else if (this.field == 'x') {
            this.source.data.y.push(this.data.pred_x[120][closest.index]);
        } else {
            this.source.data.y.push(this.data.pred_y[120][closest.index]);
        }
        this.source.change.emit();

        this.animateSquare();

        // const x = event.x;
        // const y = event.y;

        // // Push new data into the source.
        // this.source.data.x.push(x);
        // this.source.data.y.push(1.0);
        // this.source.change.emit();
    }

      // Step 2: The event handler function.
      handleReset() {
        // Clear the data from the source.
        this.source.data.x = [];
        this.source.data.y = [];
        this.source.change.emit();
    }
    
    animateSquare() {
        const square = document.getElementById('animatedSquare');
        const queryVisElement = document.getElementById('query-vis-1');

        // Get the bounding rectangle of the 'query-vis-1' element
        const rect = queryVisElement.getBoundingClientRect();

        // Position the square exactly below 'query-vis-1'
        square.style.top = (rect.bottom + window.scrollY) + 'px'; // scrollY ensures it works even if the page is scrolled
        square.style.left = rect.right - 120 + 'px';

        square.style.display = 'block';
        // square.style.backgroundColor = 'gray';
    
        // Animation - move down then right
        square.style.animation = 'moveDownThenRight 1s forwards';
        square.addEventListener('animationend', () => {
            // Change to a random color once the animation is complete
            // square.style.backgroundColor = this.getRandomColor();
            
            // Hide the square after a short delay
            setTimeout(() => {
                square.style.display = 'none';
            }, 500); // wait for 500ms before hiding the square
        }); 
    }
    
    
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    findClosestTimestamp(tappedX) {
        let closestIdx = 0;
        let closestDist = Math.abs(this.data.timestamps[0] - tappedX);
    
        for (let i = 1; i < this.data.timestamps.length; i++) {
            const dist = Math.abs(this.data.timestamps[i] - tappedX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        }
    
        return {
            index: closestIdx,
            timestamp: this.data.timestamps[closestIdx]
        };
    }
};

/* Main function for this script */
async function query_vis() {

    // Load the data
    const data = await fetch("./assets/finetune_data.mat")
        .then(response => response.arrayBuffer())
        .then(data => mat4js.read(data))
        .then(data => data.data)

    console.log(data);

    const plotQuery = new QueryPlot(data, "query-vis-1", 0);
    const plotOutput = new QueryPlot(data, "output-vis-1", 1, 'x');
    const plotOutputvy = new QueryPlot(data, "output-vis-2", 1, 'y');

    plotQuery.plot.on_event('tap', (event) => {
        console.log("tap")
        plotQuery.handleTap(event);
        setTimeout(() => {
            plotOutput.handleTap(event);
            plotOutputvy.handleTap(event);
        }, 800);
    });

    plotQuery.plot.on_event('reset', () => {
        plotQuery.handleReset();
        plotOutput.handleReset();
        plotOutputvy.handleReset();
    });

}
