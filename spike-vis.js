window.addEventListener('load', spike_vis);

class SpikeInputPlot {
    constructor(htmlId, type, field) {
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
            y_axis_label: "unit",
            x_range: [0, 1],
            y_range: [-0.5, 2.5],
            title: "Spikes"  // Add this line
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
        // if (type == 0) {
        this.plot.ygrid.grid_line_color = null;
        // }
        // if (type == 0) {
        //     this.plot.yaxis.major_label_text_font_size = '0px'; // hides the tick labels
        //     this.plot.yaxis.major_tick_line_color = null; // hides the tick lines
        // }
        // Specify y-axis tick locations
        let fixed_ticker = new Bokeh.FixedTicker({ ticks: [0., 1., 2.] });

        this.plot.yaxis.ticker = fixed_ticker;
        
        //     0: '',
        //     1: '',
        //     2: '',
        //     3: ''
        // };

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

        this.updateData();
    }

    updateData() {
        // Changes things for new data
        // this.data = data
        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: [0.1, 0.4, 0.7, 0.5, 0.3, 0.7],
                // y ones like x
                y: [0, 0, 0, 1, 2, 2],
                fill_color: ["red", "red", "red", "green", "blue", "blue"],
            }
        });

        let circleRenderer = this.plot.scatter({ field: "x" }, { field: "y" },{
            source: this.source,
            color: {field: "fill_color"},
            size: 10, 
            marker: "dash",
            angle: Math.PI / 2,
            line_width: 2,
        });
        
        let x_values = [-0.5, 0.5, 1.5, 2.5];

        x_values.forEach((x_val) => {
            let vline = new Bokeh.Span({
                location: x_val,
                dimension: 'width',  // vertical line
                line_color: 'lightgray',
                // line_dash: [4, 4],    // Optional: if you want dashed lines
                line_width: 1
            });
            this.plot.add_layout(vline);
        });
    }

    handleTap(event) {
        // const tappedX = event.x;
        // const closest = this.findClosestTimestamp(tappedX);
        
        // // Push new data into the source.
        // this.source.data.x.push(closest.timestamp);
        // if (this.type  == 0) {
        //     this.source.data.y.push(1.0);
        // } else if (this.field == 'x') {
        //     this.source.data.y.push(this.data.pred_x[120][closest.index]);
        // } else {
        //     this.source.data.y.push(this.data.pred_y[120][closest.index]);
        // }
        // this.source.change.emit();

        // this.animateSquare();
        const colors = ["red", "green", "blue"]

        const x = event.x;
        const y_tapped = event.y;
        // find closest int
        const y = Math.round(y_tapped);

        // // Push new data into the source.
        this.source.data.x.push(x);
        this.source.data.y.push(y);
        this.source.data.fill_color.push(colors[y]);
        this.source.change.emit();
    }

      // Step 2: The event handler function.
      handleReset() {
        // Clear the data from the source.
        this.source.data.x = [];
        this.source.data.y = [];
        this.source.data.fill_color = [];
        this.source.change.emit();
    }
    
};



class TokenPlot {
    constructor(htmlId) {
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            // x_axis_label: "time",
            // y_axis_label: "unit",
            x_range: [0., 1.05],
            y_range: [-0.4, 0.4],
            title: "Tokens"  // Add this line
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

        // Remove both x and y axes
        this.plot.xaxis.visible = false;
        this.plot.yaxis.visible = false;

        // Remove the title
        this.plot.title = null;

        // Remove x and y ticks (by setting their transparency to full)
        this.plot.xaxis.major_tick_line_alpha = 0;
        this.plot.xaxis.minor_tick_line_alpha = 0;
        this.plot.yaxis.major_tick_line_alpha = 0;
        this.plot.yaxis.minor_tick_line_alpha = 0;

        this.plot.yaxis.major_label_text_font_size = '0px'; // hides the tick labels
        this.plot.yaxis.major_tick_line_color = null; // hides the tick lines
        
        this.plot.toolbar_location = null
        this.plot.toolbar.logo = null

        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.updateData();
    }

    updateData() {
        // Changes things for new data
        // this.data = data
        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
                // y ones like x
                y: [0, 0, 0, 0, 0, 0],
                fill_color: ["blue", "blue", "green", "red", "red", "red"],
            }
        });

        let circleRenderer = this.plot.scatter({ field: "x" }, { field: "y" }, {
            source: this.source,
            color: "black",
            size: 30, 
            line_width: 1.5,
            line_alpha: 1.0,
            fill_color: {field: "fill_color"},
            marker: "square",
            alpha: 0.4,
        });
    }

    handleTap(event) {
        const colors = ["red", "green", "blue"]
        const y_tapped = event.y;
        // find closest int
        const y = Math.round(y_tapped);

        if (y < 0 || y > 2) {
            return;
        }

        // // Push new data into the source.
        // add last value + 0.1
        if (this.source.data.x.length == 0) {
            this.source.data.x.push(0.1);
        } else {
            this.source.data.x.push(this.source.data.x[this.source.data.x.length - 1] + 0.1);
        }
        this.source.data.y.push(0.);
        this.source.data.fill_color.push(colors[y]);

        if (this.source.data.x.length > 10) {
            // remove 0.1 from all boxes 
            this.source.data.x = this.source.data.x.map((x) => x - 0.1);
        }
        this.source.change.emit();

    }

      // Step 2: The event handler function.
      handleReset() {
        // Clear the data from the source.
        this.source.data.x = [];
        this.source.data.y = [];
        this.source.data.fill_color = [];
        this.source.change.emit();
    }
    
};

/* Main function for this script */
async function spike_vis() {
    const plotQuery = new SpikeInputPlot("spike-vis-1", 0);
    const plotOutput = new TokenPlot("token-vis-1");
    // const plotOutputvy = new QueryPlot(data, "output-vis-2", 1, 'y');

    plotQuery.plot.on_event('tap', (event) => {
        console.log("tap")
        plotQuery.handleTap(event);
        plotOutput.handleTap(event);
        // setTimeout(() => {
        //     plotOutput.handleTap(event);
        //     // plotOutputvy.handleTap(event);
        // }, 800);
    });

    plotQuery.plot.on_event('reset', () => {
        plotQuery.handleReset();
        plotOutput.handleReset();
        // plotOutputvy.handleReset();
    });

}
