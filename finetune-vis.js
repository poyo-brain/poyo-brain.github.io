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
        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.updateData(data);
    }

    updateData(data) {
        // Changes things for new data
        this.data = data;
        this.source = new Bokeh.ColumnDataSource({
            data: {
                x: this.data.unit_emb[0].map(x => x[0]),
                y: this.data.unit_emb[0].map(x => x[1]),
            }
        });

        let single_color = [];
        let last_unit_emb_x = this.data.unit_emb.slice(-1)[0].map(x => x[0]);
        let last_unit_emb_y = this.data.unit_emb.slice(-1)[0].map(x => x[1]);
        let max_x = Math.max(...last_unit_emb_x);
        let min_x = Math.min(...last_unit_emb_x);
        let max_y = Math.max(...last_unit_emb_y);
        let min_y = Math.min(...last_unit_emb_y);
        for (let i = 0; i < this.data.unit_emb[0].length; i++) {
            var hue = Math.floor(360 * last_unit_emb_x[i] / (max_x - min_x));
            single_color.push(hslToHex(hue, 100, 50));
        }

        this.plot.circle({ field: "x" }, { field: "y" }, {
            source: this.source,
            size:10, color:single_color, alpha:0.7
        });
        console.log(min_x, max_x, min_y, max_y);

        this.plot.x_range.start = min_x - 0.1;
        this.plot.x_range.end = max_x + 0.1;
        this.plot.y_range.start = min_y - 0.1;
        this.plot.y_range.end = max_y + 0.1;
    }

    updateStep(step) {
        this.source.data.x = this.data.unit_emb[step].map(x => x[0]);
        this.source.data.y = this.data.unit_emb[step].map(x => x[1]);
        this.source.change.emit();
    }
};

class HandVelPlot {
    constructor(data, idx, linecolor, htmlId) {
        // idx: 0 => Vx, 1 => Vy
        this.container = document.getElementById(htmlId);

        this.plot = Bokeh.Plotting.figure({
            height: parseInt(window.getComputedStyle(this.container).height.slice(0, -2)),
            width: parseInt(window.getComputedStyle(this.container).width.slice(0, -2)),
        })
        this.plot.toolbar.logo = null;
        this.plot.toolbar_location = null;
        Bokeh.Plotting.show(this.plot, '#' + htmlId);

        this.num_samples =150; 
        // TODO: Remove this whole num_samples thing
        // The data should contain only the samples that are needed
        this.linecolor = linecolor;
        this.idx = idx;
        this.updateData(data);
    }

    updateData(data) {
        this.data = data;
        const vx_timestamps = this.data.timestamps[0].slice(1, this.num_samples);

        this.source_gt = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: this.data.gt[0].map(x => x[this.idx]).slice(1, this.num_samples) 
            }
        });
        this.plot.line({ field: "x" }, { field: "y" }, {
            source: this.source_gt,
            line_width: 2,
            color: "#000"
        });

        this.source_pred = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: data.pred[0].map(x => x[this.idx]).slice(1, this.num_samples) 
            }
        });
        this.plot.line({ field: "x" }, { field: "y" }, {
            source: this.source_pred,
            line_width: 2,
            color: this.linecolor
        });
    }

    updateStep(step) {
        this.source_pred.data.y = this.data.pred[step].map(x => x[this.idx]).slice(1, this.num_samples);
        this.source_pred.change.emit();
    }
}

async function finetune_vis() {

    // Load the data
    const data = await fetch("./assets/finetune_data.mat")
        .then(response => response.arrayBuffer())
        .then(data => mat4js.read(data))
        .then(data => data.data)

    const plotHandVel = [
        new HandVelPlot(data, 0, "#F00", "finetune-vis-vx-plot"),
        new HandVelPlot(data, 1, "#00F", "finetune-vis-vy-plot")
    ];
    plotHandVel[1].plot.x_axis_label = "time (s)"

    const plotEmb = new UnitEmbPlot(data, "finetune-vis-emb");

    // Metrics display
    const r2Element = document.getElementById("finetune-vis-r2")
    const epochElement = document.getElementById("finetune-vis-epoch")
    function updateStep(step) {
        plotEmb.updateStep(step);
        for (let i = 0; i < 2; i++)
            plotHandVel[i].updateStep(step);

        r2Element.textContent = "R2: " + data.r2[step].toFixed(2);
        epochElement.textContent = "Epoch: " + data.epochs[step];
    }

    const num_steps = data.epochs.length;
    let playing = false; // Not playing
    let step = 0;
    function next() {
        step += 1;
        if (step >= num_steps) {
            step = 0;
            playing = false;
            addDataButton.textContent = "Play";
        } else {
            updateStep(step);
        }

        if (playing)
            setTimeout(next, 100);
    }

    function playpause() {
        if (playing) {
            playing = false;
            addDataButton.textContent = "Play";
            return;
        } {
            playing = true;
            addDataButton.textContent = "Pause";
            next();
        }
    }

    const addDataButton = document.getElementById("finetune-vis-button");
    addDataButton.addEventListener("click", playpause);

    updateStep(0);
}
