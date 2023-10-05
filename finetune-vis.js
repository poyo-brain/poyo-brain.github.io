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
    // Unit embedding
    const plotEmb = Bokeh.Plotting.figure({
        title: "Unit Embeddings",
        height: 500,
        width: 500,
        x_axis_label: "PC1",
        y_axis_label: "PC2",
        x_range: [-0.5, 0.7],
        y_range: [-0.6, 0.7]
    });
    plotEmb.toolbar.logo = null
    plotEmb.toolbar_location = null
    Bokeh.Plotting.show(plotEmb, "#finetune-vis-emb");

    const unit_source = new Bokeh.ColumnDataSource({
        data: {
            x: data.unit_emb[0].map(x => x[0]),
            y: data.unit_emb[0].map(x => x[1]),
        }
    });

    single_color = [];
    let last_unit_emb = data.unit_emb.slice(-1)[0].map(x => x[0]);
    let max_x = Math.max(...last_unit_emb);
    let min_x = Math.min(...last_unit_emb);
    console.log(last_unit_emb);
    for (let i = 0; i < data.unit_emb[0].length; i++) {
        var hue = Math.floor(360 * last_unit_emb[i] / (max_x - min_x));
        single_color.push(hslToHex(hue, 100, 50));
    }

    plotEmb.circle({ field: "x" }, { field: "y" }, {
        source: unit_source,
        size:10, color:single_color, alpha:0.7
    });


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
        unit_source.data.x = data.unit_emb[step].map(x => x[0]);
        unit_source.data.y = data.unit_emb[step].map(x => x[1]);
        unit_source.change.emit();

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
