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
        this.plot = Bokeh.Plotting.figure({
            title: "Unit Embeddings",
            height: 500,
            width: 500,
            x_axis_label: "PC1",
            y_axis_label: "PC2",
            x_range: [-0.5, 0.7],
            y_range: [-0.6, 0.7]
        });
        this.plot.toolbar.logo = null
        this.plot.toolbar_location = null
        Bokeh.Plotting.show(this.plot, htmlId);

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

async function finetune_vis() {

    // Load the data
    const data = await fetch("./assets/file_processed.mat")
        .then(response => response.arrayBuffer())
        .then(data => mat4js.read(data))
        .then(data => data.data)

    /* Make empty plots */
    // VX
    let plotHandVel = []
    for (let i = 0; i < 2; i++) {
        let plot = Bokeh.Plotting.figure({
            title: i == 0 ? "Vx" : "Vy",
            height: 300,
            width: 500,
            x_axis_label: "time (s)"
        })
        plot.toolbar.logo = null
        plot.toolbar_location = null
        plotHandVel.push(plot)
    }
    Bokeh.Plotting.show(plotHandVel[0], "#finetune-vis-hand-vx-plot");
    Bokeh.Plotting.show(plotHandVel[1], "#finetune-vis-hand-vy-plot");

    const plotEmb = new UnitEmbPlot(data, "#finetune-vis-emb");

    // Prepare data for plots
    const num_steps = data.gt.length;
    const num_samples = 300;

    /* VX */
    const vx_timestamps = data.timestamps[0].slice(1, num_samples);
    // GT
    let source_gt = [];
    let source_pred = [];
    for (let i = 0; i < 2; i++) {
        let gt = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: data.gt[0].map(x => x[i]).slice(1, num_samples) 
            }
        });
        plotHandVel[i].line({ field: "x" }, { field: "y" }, {
            source: gt,
            line_width: 2,
            color: "#000"
        });
        source_gt.push(gt);

        let pred = new Bokeh.ColumnDataSource({
            data: { 
                x: vx_timestamps, 
                y: data.pred[0].map(x => x[i]).slice(1, num_samples) 
            }
        });
        plotHandVel[i].line({ field: "x" }, { field: "y" }, {
            source: pred,
            line_width: 2,
            color: i == 0 ? "#F00": "#00F"
        });
        source_pred.push(pred);
    }
    // Prediction


    const r2Element = document.getElementById("finetune-vis-r2")
    const epochElement = document.getElementById("finetune-vis-epoch")
    function update(step) {
        for (let i = 0; i < 2; i++) {
            source_pred[i].data.y = data.pred[step].map(x => x[i]).slice(1, num_samples);
            source_pred[i].change.emit();
        }
        plotEmb.updateStep(step);

        r2Element.textContent = "R2: " + data.r2[step].toFixed(2);
        epochElement.textContent = "Epoch: " + data.epochs[step];
    }

    let playing = false; // Not playing
    let step = 0;
    function next() {
        step += 1;
        if (step >= num_steps) {
            step = 0;
            playing = false;
            addDataButton.textContent = "Play";
        } else {
            update(step);
        }

        if (playing)
            setTimeout(next, 100);
    }

    function play() {
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
    addDataButton.addEventListener("click", play);

    update(0);
}
