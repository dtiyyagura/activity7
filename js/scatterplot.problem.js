function scatter_plot(data, ax, title = "", xCol = "", yCol = "", rCol = "", legend = [], colorCol = "", margin = 50) {    
    // Extract X, Y, and R columns
    const X = data.map(d => d[xCol]);
    const Y = data.map(d => d[yCol]);
    const R = data.map(d => d[rCol]);

    // Generate unique categories for color coding
    const colorCategories = Array.from(new Set(data.map(d => d[colorCol])));
    const colorScale = d3.scaleOrdinal()
        .domain(colorCategories)
        .range(d3.schemeTableau10);

    // Determine axis ranges with margins
    const xRange = d3.extent(X, d => +d);
    const yRange = d3.extent(Y, d => +d);
    const xBuffer = (xRange[1] - xRange[0]) * 0.05;
    const yBuffer = (yRange[1] - yRange[0]) * 0.05;

    // Scale functions for axes
    const xScale = d3.scaleLinear()
        .domain([xRange[0] - xBuffer, xRange[1] + xBuffer])
        .range([margin, 1000 - margin]);

    const yScale = d3.scaleLinear()
        .domain([yRange[0] - yBuffer, yRange[1] + yBuffer])
        .range([1000 - margin, margin]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(R, d => +d))
        .range([4, 12]);

    // Select SVG and plot points
    const svg = d3.select(`${ax}`);
    svg.selectAll('.markers')
        .data(data)
        .join('g')
        .attr('transform', d => `translate(${xScale(d[xCol])}, ${yScale(d[yCol])})`)
        .append('circle')
        .attr("class", d => `circle ${d[colorCol]}`)
        .attr("data-model", d => d.Model)
        .attr("r", d => rScale(d[rCol]))
        .attr("fill", d => colorScale(d[colorCol]))
        .style("fill-opacity", 1);

    // Create and append axes
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${1000 - margin})`)
        .call(d3.axisBottom(xScale).ticks(4));

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin},0)`)
        .call(d3.axisLeft(yScale).ticks(4));

    // Add axis labels
    svg.append("text")
        .attr("class", "label")
        .attr("transform", `translate(${500},${1000 - 10})`)
        .text(ax === "#figure2" ? "EngineSizeCI" : xCol)
        .attr("fill", "black");

    svg.append("text")
        .attr("transform", `translate(${35},${500}) rotate(270)`)
        .text(yCol)
        .attr("fill", "black");

    // Add plot title
    svg.append("text")
        .attr("x", 500)
        .attr("y", 80)
        .attr("text-anchor", "middle")
        .text(title)
        .attr("class", "title")
        .attr("fill", "black");

    // Initialize brush for selection
    const brush = d3.brush()
        .on("start", handleBrushStart)
        .on("brush end", handleBrushMove)
        .extent([[margin, margin], [1000 - margin, 1000 - margin]]);

    svg.call(brush);

    function handleBrushStart() {
        if (!d3.brushSelection(this)) {
            d3.selectAll("circle").classed("selected", false);
        }
    }

    function handleBrushMove() {
        const selection = d3.brushSelection(this);
        if (!selection) return;

        const [x0, y0] = selection[0];
        const [x1, y1] = selection[1];

        const xMin = xScale.invert(x0);
        const xMax = xScale.invert(x1);
        const yMin = yScale.invert(y1);
        const yMax = yScale.invert(y0);

        d3.selectAll("circle").classed("selected", d =>
            d[xCol] >= xMin && d[xCol] <= xMax && d[yCol] >= yMin && d[yCol] <= yMax
        );
    }

    // Add legend
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${800},${margin})`);

    if (!legend.length) legend = colorCategories;

    const legendItems = legendGroup.selectAll(".legend-item")
        .data(legend)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 45})`);

    legendItems.append("rect")
        .attr("fill", d => colorScale(d))
        .attr("width", 40)
        .attr("height", 40)
        .attr("class", "legend-box")
        .attr("data-category", d => d);

    legendItems.append("text")
        .attr("x", 50)
        .attr("y", 25)
        .text(d => d)
        .style("font-size", "24px")
        .attr("alignment-baseline", "middle")
        .style("fill", "black");

    legendItems.on("click", (event, category) => {
        const isDimmed = d3.select(event.currentTarget).select("rect").classed("inactive");
        d3.select(event.currentTarget).select("rect")
            .classed("inactive", !isDimmed)
            .style("fill-opacity", isDimmed ? 1 : 0.3);

        d3.selectAll(`.circle.${category.replace(/\s+/g, '_')}`)
            .style("fill-opacity", isDimmed ? 1 : 0.1);
    });
}
