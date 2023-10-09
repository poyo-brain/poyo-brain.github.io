window.addEventListener('load', finetune_vis);

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


const session_types = ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 
    'C', 'C', 'C', 'C', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 
    'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 
    'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 'M', 
    'M', 'J', 'J', 'J', 'I', 'I', 'I', 'L', 'I', 'I', 'L', 
    'I', 'I', 'L', 'I', 'I', 'I', 'I', 'L', 'I', 'I', 'I', 
    'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 
    'I', 'I', 'L', 'I', 'I', 'I', 'I', 'L', 'I', 'L', 'I', 
    'I', 'I', 'I', 'I', 'N', 'N', 'N', 'N', 'N', 'Je', 'Je', 
    'Je', 'Je', 'F', 'F', 'F', 'F', 'F']

class UnitEmbPlot {
    constructor(data, htmlId) {
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            x_axis_label: "PC1",
            y_axis_label: "PC2",
            x_range: [-0.5, 0.7],
            y_range: [-0.6, 0.7]
        });
        this.plot.toolbar.logo = null
        this.plot.toolbar_location = null
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.yaxis.major_label_text_font_size = "10px";
        this.plot.xaxis.major_label_text_font_size = "10px";
        this.plot.yaxis.minor_tick_line_color = null;
        this.plot.yaxis.axis_label_standoff = 2;
        this.plot.xaxis.minor_tick_line_color = null;
        this.plot.xaxis.axis_label_standoff = 20;
        this.plot.toolbar.active_drag = null;

        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.updateData(data);
    }

    updateData(data) {
        // Changes things for new data
        this.data = data;
        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: this.data.unit_emb_x[0],
                y: this.data.unit_emb_y[0],
            }
        });

        let colors = [];
        let max_x = Math.max(...this.data.unit_emb_x[0]);
        let min_x = Math.min(...this.data.unit_emb_x[0]);
        for (let i = 0; i < this.data.unit_emb_x[0].length; i++) {
            var hue = Math.floor(360 * (this.data.unit_emb_x[0][i] - min_x) / (max_x - min_x));
            colors.push(hslToHex(hue, 100, 50));
        }

        this.plot.circle({ field: "x" }, { field: "y" }, {
            source: this.source,
            color: "pink",
            size: 10, 
            alpha: 0.7
        });

        let last_unit_emb_x = this.data.unit_emb_x.slice(-1)[0];
        let last_unit_emb_y = this.data.unit_emb_y.slice(-1)[0];
        let min = Math.min(Math.min(...last_unit_emb_x), Math.min(...last_unit_emb_y));
        let max = Math.max(Math.max(...last_unit_emb_x), Math.max(...last_unit_emb_y));
        this.plot.x_range.start = min - 0.1;
        this.plot.x_range.end = max + 0.1;
        this.plot.y_range.start = min - 0.1;
        this.plot.y_range.end = max + 0.1;
    }

    updateStep(step) {
        this.source.data.x = this.data.unit_emb_x[step];
        this.source.data.y = this.data.unit_emb_y[step];
        this.source.change.emit();
    }
};

class SessEmbPlot {
    constructor(data, sess_md, htmlId) {
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            x_axis_label: "PC1",
            y_axis_label: "PC2",
            x_range: [-0.5, 0.7],
            y_range: [-0.6, 0.7],
            tools: "hover"
        });
        this.plot.toolbar.logo = null
        this.plot.toolbar_location = null
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.yaxis.minor_tick_line_color = null;
        this.plot.yaxis.axis_label_standoff = 2;
        this.plot.xaxis.minor_tick_line_color = null;
        this.plot.xaxis.axis_label_standoff = 2;
        this.plot.toolbar.active_drag = null;

        this.plot.xgrid.grid_line_color = null;
        this.plot.ygrid.grid_line_color = null;

        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.sess_md = sess_md;
        this.updateData(data);
    }

    updateData(data) {
        // Changes things for new data
        this.data = data;
        this.source_all = new Bokeh.ColumnDataSource({
            data: {
                x: this.data.all_sess_emb_x,
                y: this.data.all_sess_emb_y,
                cat: this.sess_md.types,
                names: this.sess_md.names
            }
        });

        let colors = [];
        let max_x = Math.max(...this.data.unit_emb_x[0]);
        let min_x = Math.min(...this.data.unit_emb_x[0]);
        for (let i = 0; i < this.data.unit_emb_x[0].length; i++) {
            var hue = Math.floor(360 * (this.data.unit_emb_x[0][i] - min_x) / (max_x - min_x));
            colors.push(hslToHex(hue, 100, 50));
        }

        let palette = Bokeh.Palettes.d3.Category10.Category10_8;
        let mapper = new Bokeh.CategoricalColorMapper({
            factors: ['C', 'M', 'J', 'Je', 'N', 'I', 'L', 'F'],
            palette: palette
        });

        this.plot.circle({ field: "x" }, { field: "y" }, {
            source: this.source_all,
            color: { field: "cat", transform: mapper },
            size: 6, 
            alpha: 0.5
        });


        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: [this.data.sess_emb_x[0]],
                y: [this.data.sess_emb_y[0]],
                names: ["Current Session"]
            }
        });

        const hover = this.plot.toolbar.select_one(Bokeh.HoverTool)
        hover.tooltips = (source, info) => {
            const div = document.createElement("div")
            div.innerHTML = source.data.names[info.index]
            return div
        }

        this.plot.circle({ field: "x" }, { field: "y" }, {
            source: this.source,
            color: "black",
            size: 8, 
            alpha: 1.0
        });

        // Axis ranges
        let last_unit_emb_x = this.data.all_sess_emb_x;
        let last_unit_emb_y = this.data.all_sess_emb_y;
        this.plot.x_range.start = Math.min(...last_unit_emb_x) - 0.1;
        this.plot.x_range.end = Math.max(...last_unit_emb_x) + 0.1;
        this.plot.y_range.start = Math.min(...last_unit_emb_y) - 0.1;
        this.plot.y_range.end = Math.max(...last_unit_emb_y) + 0.1;
    }

    updateStep(step) {
        this.source.data.x = [this.data.sess_emb_x[step]];
        this.source.data.y = [this.data.sess_emb_y[step]];
        this.source.change.emit();
    }
}

class HandVelPlot {
    constructor(data, linecolor, htmlId) {
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
            y_range: [-1, 1]
        })
        this.plot.toolbar.logo = null;
        this.plot.toolbar_location = null;
        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        // Remove grid lines
        this.plot.xgrid.grid_line_color = null;
        this.plot.ygrid.grid_line_color = null;
        this.plot.toolbar.active_drag = null;

        // Clean up axis
        this.plot.yaxis.axis_label_text_font_style = "normal";
        this.plot.yaxis.minor_tick_line_color = null;
        this.plot.yaxis.axis_label_standoff = 2;
        this.plot.xaxis.axis_label_text_font_style = "normal";
        this.plot.xaxis.minor_tick_line_color = null;
        this.plot.xaxis.axis_label_standoff = 2;


        this.num_samples =150; 
        // TODO: Remove this whole num_samples thing
        // The data should contain only the samples that are needed
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
                y: this.data.pred[0]
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

    updateStep(step) {
        this.source_pred.data.y = this.data.pred[step];
        this.source_pred.change.emit();
    }
}

/* Main function for this script */
async function finetune_vis() {

    // Load the data
    const data = await fetch("./assets/finetune_data.mat")
        .then(response => response.arrayBuffer())
        .then(data => mat4js.read(data))
        .then(data => data.data)

    const sess_md = await fetch("./assets/sess_md.json")
    .then(response => response.json())

    console.log(sess_md)

    const plotHandVel = [
        new HandVelPlot({gt: data.gt_x, pred: data.pred_x, timestamps: data.timestamps}, "#F00", "finetune-vis-vx-plot"),
        new HandVelPlot({gt: data.gt_y, pred: data.pred_y, timestamps: data.timestamps}, "#00F", "finetune-vis-vy-plot")
    ];
    plotHandVel[0].plot.xaxis.axis_label = "time (s)";
    plotHandVel[0].plot.yaxis.axis_label = "Vx";
    plotHandVel[1].plot.xaxis.axis_label = "time (s)";
    plotHandVel[1].plot.yaxis.axis_label = "Vy";

    const plotEmb = new UnitEmbPlot(data, "finetune-vis-emb");
    const plotSess = new SessEmbPlot(data, sess_md, "finetune-vis-session-emb");


    const num_steps = data.epochs.length;

    // Metrics display
    const r2Element = document.getElementById("finetune-vis-r2")
    const epochElement = document.getElementById("finetune-vis-epoch")

    // Slider
    const slider = document.getElementById('finetune-vis-slider'); slider.max = num_steps-1; // Assuming num_steps is defined
    slider.addEventListener('input', (event) => {
        step = parseInt(event.target.value);
        updateStep(step);
    });

    function updateStep(step) {
        plotEmb.updateStep(step);
        plotSess.updateStep(step);
        for (let i = 0; i < 2; i++)
            plotHandVel[i].updateStep(step);

        slider.value = step;
        r2Element.textContent = data.r2[step].toFixed(2);
        epochElement.textContent = data.epochs[step];
    }

    // play button
    let playing = false; // Not playing
    let step = 0;
    function next() {
        if (step >= num_steps) {
            step = 0;
            playpause();
            return;
        }

        updateStep(step);
        step += 1;

        if (playing)
            setTimeout(next, 100);

    }

    function playpause() {
        if (playing) {
            playing = false;
            addDataButton.innerHTML ='<i class="fa fa-play"></i>'
            return;
        } {
            playing = true;
            addDataButton.innerHTML ='<i class="fa fa-pause"></i>'
            next();
        }
    }

    const addDataButton = document.getElementById("finetune-vis-button");
    addDataButton.addEventListener("click", playpause);
    
    updateStep(0);
}

