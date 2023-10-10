window.addEventListener('load', function() {
    // Initialize with the default data source
    sample_vis(document.getElementById('data-source').value);

    // Add event listener for the dropdown menu
    document.getElementById('data-source').addEventListener('change', function() {
        // Re-run the visualization with the new data source
        sample_vis(this.value);
    });
});

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

class SampleHandVelPlot {
    constructor(data, linecolor, htmlId) {
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            y_range: [-1, 1]
        })
        this.plot.toolbar.logo = null;
        this.plot.toolbar_location = null;
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.toolbar.active_drag = null;
        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        // Remove grid lines
        this.plot.xgrid.grid_line_color = null;
        this.plot.ygrid.grid_line_color = null;

        this.linecolor = linecolor;
        this.updateData(data);
    }

    updateData(data) {
        this.data = data;
        const vx_timestamps = this.data.timestamps;

        this.source_gt = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: this.data.gt
            }
        });
        this.plot.line({ field: "x" }, { field: "y" }, {
            source: this.source_gt,
            line_width: 2,
            legend_label: "Ground Truth",
            color: "#000"
        });

        this.plot.legend.location = "bottom_left";
        this.plot.legend.label_text_font_size = "8px";
        this.plot.legend.background_fill_alpha = 0.75;
        this.plot.legend.padding = 4;
        this.plot.legend.spacing = -10;
        this.plot.legend.margin = 0;

        this.source_pred = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: this.data.pred
            }
        });
        this.plot.line({ field: "x" }, { field: "y" }, {
            source: this.source_pred,
            legend_label: "Prediction",
            line_width: 2,
            color: this.linecolor
        });

        this.plot.y_range.start = Math.min(...this.source_gt.data.y) - 0.1;
        this.plot.y_range.end = Math.max(...this.source_gt.data.y) + 0.1;
    }

    updateStep(cutoffTimestamp) {
        const filteredX = this.data.timestamps.filter(timestamp => timestamp <= cutoffTimestamp);
        const filteredY = this.data.gt.slice(0, filteredX.length);
        const filteredPred = this.data.pred.slice(0, filteredX.length);

        this.source_gt.data = {
            x: filteredX,
            y: filteredY
        };
        this.source_gt.change.emit();

        this.source_pred.data = {
            x: filteredX,
            y: filteredPred
        };
        this.source_pred.change.emit();
    }
}


class SpikePlot {
    constructor(data, htmlId) {
        this.container = document.getElementById(htmlId);
        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            y_range: [0, 1]
        })
        this.plot.toolbar.logo = null;
        this.plot.toolbar_location = null;
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.toolbar.active_drag = null;
        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        // Remove grid lines
        this.plot.xgrid.grid_line_color = null;
        this.plot.ygrid.grid_line_color = null;

        this.updateData(data);
    }

    updateData(data) {
        this.data = data;

        const num_units = Math.max(...this.data.spike_unit_id);

        this.source = new Bokeh.ColumnDataSource({
            data: { 
                x: this.data.spike_timestamps,
                y: this.data.spike_unit_id
            }
        });
        this.plot.scatter({ field: "x" }, { field: "y" }, {
            source: this.source,
            // line_width: 2,
            // legend_label: "Ground Truth",
            color: "#000",
            marker: "dash",
            angle: Math.PI / 2,
        });

        this.plot.legend.location = "bottom_left";
        this.plot.legend.label_text_font_size = "8px";
        this.plot.legend.background_fill_alpha = 0.75;
        this.plot.legend.padding = 4;
        this.plot.legend.spacing = -10;
        this.plot.legend.margin = 0;

        this.plot.y_range.start = -1;
        this.plot.y_range.end = num_units + 1;
    }

    updateStep(cutoffTimestamp) {
        const filteredX = this.data.spike_timestamps.filter(timestamp => timestamp <= cutoffTimestamp);
        const filteredY = this.data.spike_unit_id.slice(0, filteredX.length);

        this.source.data = {
            x: filteredX,
            y: filteredY
        };
        this.plot.x_range.end = Math.max(...filteredX);
        this.plot.x_range.start = this.plot.x_range.end - 1;
        this.source.change.emit();
    }
}

// Helper function to clear container
function clearContainer(containerId) {
    const container = document.getElementById(containerId);
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

async function sample_vis(dataSourceURL) {
    // Clear the plots' containers before loading new data
    clearContainer("vis-vx-plot");
    clearContainer("vis-vy-plot");
    clearContainer("vis-spike-plot");

    // Load the data from the specified URL
    const data = await fetch(dataSourceURL)
        .then(response => response.json());

    const plotHandVel = [
        new SampleHandVelPlot({gt: data.vx_gt, pred: data.vx_pred_poyo_1, timestamps: data.v_timestamps}, "#F00", "vis-vx-plot"),
        new SampleHandVelPlot({gt: data.vy_gt, pred: data.vy_pred_poyo_1, timestamps: data.v_timestamps}, "#00F", "vis-vy-plot")
    ];
    // plotHandVel[0].plot.xaxis.axis_label = "time (s)";
    plotHandVel[0].plot.yaxis.axis_label = "Vx";
    plotHandVel[1].plot.xaxis.axis_label = "time (s)";
    plotHandVel[1].plot.yaxis.axis_label = "Vy";

    const plotSpike = new SpikePlot(data, "vis-spike-plot");

    // plotSpike.plot.xaxis.axis_label = "time (s)";
    plotSpike.plot.yaxis.axis_label = "Unit ID";


//     const num_steps = 300;

//     // // Metrics display
//     // const r2Element = document.getElementById("finetune-vis-r2")
//     // const epochElement = document.getElementById("finetune-vis-epoch")

//     // Slider
//     const slider = document.getElementById('vis-slider');
//     slider.max = num_steps-1; // Assuming num_steps is defined
//     slider.addEventListener('input', (event) => {
//         step = parseInt(event.target.value);
//         updateStep(step);
//     });

//     function updateStep(step) {
//         const cutoffTimestamp = data.v_timestamps[step];

//         plotSpike.updateStep(cutoffTimestamp);
//         for (let i = 0; i < 2; i++)
//             plotHandVel[i].updateStep(cutoffTimestamp);

//         slider.value = step;
//     }

//     // play button
//     let playing = false; // Not playing
//     let step = 0;
//     function next() {
//         if (step >= num_steps) {
//             step = 0;
//             playpause();
//             return;
//         }

//         updateStep(step);
//         step += 1;

//         if (playing)
//             setTimeout(next, 40);

//     }

//     function playpause() {
//         if (playing) {
//             playing = false;
//             addDataButton.textContent = "\u25ba";
//             return;
//         } {
//             playing = true;
//             addDataButton.textContent = "\u23f8";
//             next();
//         }
//     }

//     const addDataButton = document.getElementById("vis-button");
//     addDataButton.addEventListener("click", playpause);
    
//     updateStep(0);
}
