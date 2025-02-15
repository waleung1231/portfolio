let data = [];
let commits = [];
let xScale, yScale;
let brushSelection = null;

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

console.log("Main.js loaded");

const width = 1000;
const height = 600;

async function loadData() {
    try {
        console.log("Loading data...");
        data = await d3.csv('../meta/loc.csv', (row) => {
            try {
                return {
                    ...row,
                    line: Number(row.line),
                    depth: Number(row.depth),
                    length: Number(row.length),
                    date: new Date(row.date + 'T00:00' + row.timezone),
                    datetime: new Date(row.datetime),
                };
            } catch (e) {
                console.error("Error parsing row:", row, e);
                return null;
            }
        });
        
        console.log("Data loaded:", data.length, "rows");
        
        if (!data.length) {
            throw new Error("No data loaded");
        }

        processCommits();
        console.log("Processed commits:", commits.length);
        
        displayStats();
        console.log("Stats displayed");
        
        createScatterplot();
        console.log("Scatterplot created");
        
        brushSelector();
        console.log("Brush initialized");
    } catch (error) {
        console.error("Error in loadData:", error);
    }
}

function processCommits() {
    try {
        commits = d3.groups(data, d => d.commit)
            .map(([commit, lines]) => {
                let first = lines[0];
                let { author, date, time, timezone, datetime } = first;

                return {
                    id: commit,
                    url: 'https://github.com/YOUR_REPO/commit/' + commit,
                    author,
                    date,
                    time,
                    timezone,
                    datetime,
                    hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                    totalLines: lines.length,
                    lines: lines, // Store the lines for language breakdown
                };
            });
    } catch (error) {
        console.error("Error in processCommits:", error);
        commits = [];
    }
}

function createScatterplot() {
    try {
        if (commits.length === 0) {
            console.warn("No commit data available for scatterplot.");
            return;
        }

        // Clear any existing chart
        d3.select('#chart').select('svg').remove();

        const margin = { top: 10, right: 10, bottom: 40, left: 50 };
        const usableArea = {
            top: margin.top,
            right: width - margin.right,
            bottom: height - margin.bottom,
            left: margin.left,
            width: width - margin.left - margin.right,
            height: height - margin.top - margin.bottom,
        };

        const svg = d3
            .select('#chart')
            .append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('overflow', 'visible');

        xScale = d3
            .scaleTime()
            .domain(d3.extent(commits, (d) => d.datetime))
            .range([usableArea.left, usableArea.right])
            .nice();

        yScale = d3
            .scaleLinear()
            .domain([0, 24])
            .range([usableArea.bottom, usableArea.top]);

        const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
        const rScale = d3
            .scaleSqrt()
            .domain([minLines, maxLines])
            .range([2, 30]);

        const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

        // Add container for dots
        const dots = svg.append('g')
            .attr('class', 'dots');

        // Add gridlines
        const gridlines = svg
            .append('g')
            .attr('class', 'gridlines')
            .attr('transform', `translate(${usableArea.left}, 0)`);

        gridlines.call(d3.axisLeft(yScale)
            .tickFormat('')
            .tickSize(-usableArea.width));

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale)
            .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

        svg.append('g')
            .attr('transform', `translate(0, ${usableArea.bottom})`)
            .call(xAxis);

        svg.append('g')
            .attr('transform', `translate(${usableArea.left}, 0)`)
            .call(yAxis);

        // Draw dots
        dots.selectAll('circle')
            .data(sortedCommits)
            .join('circle')
            .attr('cx', (d) => xScale(d.datetime))
            .attr('cy', (d) => yScale(d.hourFrac))
            .attr('r', (d) => rScale(d.totalLines))
            .style('fill', 'steelblue')
            .style('fill-opacity', 0.7)
            .style('stroke', '#333')
            .style('stroke-width', 0.5)
            .on('mouseenter', function(event, commit) {
                d3.select(this).style('fill-opacity', 1);
                updateTooltipContent(commit);
                updateTooltipVisibility(true);
                updateTooltipPosition(event);
            })
            .on('mousemove', (event) => updateTooltipPosition(event))
            .on('mouseleave', function() {
                d3.select(this).style('fill-opacity', 0.7);
                updateTooltipVisibility(false);
            });

    } catch (error) {
        console.error("Error in createScatterplot:", error);
    }
}

function brushSelector() {
    try {
        const svg = document.querySelector('#chart svg');
        if (!svg) {
            console.error("SVG element not found");
            return;
        }
        // Create brush
        d3.select(svg).call(d3.brush().on('start brush end', brushed));

        // Raise dots and everything after overlay
        d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
    } catch (error) {
        console.error("Error in brushSelector:", error);
    }
}

function brushed(event) {
    try {
        brushSelection = event.selection;
        updateSelection();
        updateSelectionCount();
        updateLanguageBreakdown();
    } catch (error) {
        console.error("Error in brushed:", error);
    }
}

function isCommitSelected(commit) {
    if (!brushSelection) {
        return false;
    }
    
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    
    return x >= brushSelection[0][0] && 
           x <= brushSelection[1][0] && 
           y >= brushSelection[0][1] && 
           y <= brushSelection[1][1];
}

function updateSelection() {
    try {
        d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
    } catch (error) {
        console.error("Error in updateSelection:", error);
    }
}

function updateSelectionCount() {
    try {
        const selectedCommits = brushSelection
            ? commits.filter(isCommitSelected)
            : [];

        const countElement = document.getElementById('selection-count');
        if (countElement) {
            countElement.textContent = `${
                selectedCommits.length || 'No'
            } commits selected`;
        }

        return selectedCommits;
    } catch (error) {
        console.error("Error in updateSelectionCount:", error);
    }
}

function updateLanguageBreakdown() {
    try {
        const selectedCommits = brushSelection
            ? commits.filter(isCommitSelected)
            : [];
        const container = document.getElementById('language-breakdown');
        
        if (!container) {
            console.error("Language breakdown container not found");
            return;
        }

        if (selectedCommits.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const requiredCommits = selectedCommits.length ? selectedCommits : commits;
        const lines = requiredCommits.flatMap((d) => d.lines);

        const breakdown = d3.rollup(
            lines,
            (v) => v.length,
            (d) => d.type
        );

        container.innerHTML = '';

        for (const [language, count] of breakdown) {
            const proportion = count / lines.length;
            const formatted = d3.format('.1~%')(proportion);

            container.innerHTML += `
                <dt>${language}</dt>
                <dd>${count} lines (${formatted})</dd>
            `;
        }

        return breakdown;
    } catch (error) {
        console.error("Error in updateLanguageBreakdown:", error);
    }
}

// Keep your existing tooltip functions
function updateTooltipContent(commit) {
    const tooltip = document.getElementById('commit-tooltip');
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (!commit.id) {
        tooltip.hidden = true;
        return;
    }

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime.toLocaleString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' });
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    if (tooltip) {
        tooltip.hidden = !isVisible;
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    if (tooltip) {
        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
    }
}

function displayStats() {
    try {
        const statsContainer = d3.select('#stats').append('dl').attr('class', 'summary-stats');

        statsContainer.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
        statsContainer.append('dd').text(data.length);

        statsContainer.append('dt').text('Total Commits');
        statsContainer.append('dd').text(commits.length);

        let maxFileLength = d3.max(data, d => d.line);
        statsContainer.append('dt').text('Max File Length');
        statsContainer.append('dd').text(maxFileLength);

        let avgLineLength = d3.mean(data, d => d.length);
        statsContainer.append('dt').text('Avg Line Length');
        statsContainer.append('dd').text(avgLineLength.toFixed(2));

        const workByHour = d3.rollups(
            data,
            v => v.length,
            d => d.datetime.getHours()
        );
        let peakHour = d3.greatest(workByHour, d => d[1])?.[0];

        statsContainer.append('dt').text('Most Active Commit Hour');
        statsContainer.append('dd').text(`${peakHour}:00`);
    } catch (error) {
        console.error("Error in displayStats:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});