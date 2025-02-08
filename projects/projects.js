import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Select elements from the DOM
const projectsTitle = document.querySelector('.projects-title');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select("#projects-pie-plot");
const legendContainer = d3.select('.legend');

let projects = [];
let selectedYear = null; // Store selected year
let query = ''; // Store user query for searching

// **Fetch and render projects**
fetchJSON('../lib/projects.json')
    .then(fetchedProjects => {
        console.log("Fetched Projects:", fetchedProjects);
        projects = fetchedProjects;
        updateProjects(projects);
        renderPieChart(projects); // Initial render
    })
    .catch(error => console.error("Error loading projects:", error));

// **Step 4.2 - Search Box Filtering**
if (searchInput) {
    searchInput.addEventListener('input', (event) => {
        query = event.target.value.toLowerCase();
        let filteredProjects = projects.filter(project => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query);
        });

        updateProjects(filteredProjects);
        renderPieChart(filteredProjects);
    });
} else {
    console.warn("🔍 Search bar not found in DOM!");
}

// **Step 4.4 - Function to update projects list**
function updateProjects(filteredProjects) {
    projectsContainer.innerHTML = ''; // Clear old content
    if (projectsTitle) projectsTitle.textContent = `Projects (${filteredProjects.length})`;

    if (filteredProjects.length === 0) {
        projectsContainer.innerHTML = "<p>No projects available.</p>";
    } else {
        filteredProjects.forEach(project => renderProjects(project, projectsContainer, 'h2'));
    }
}

// **Step 4.4 - Function to render pie chart dynamically**
function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

    svg.selectAll("path").remove();
    legendContainer.selectAll("li").remove();

    if (data.length === 0) return;

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let pieGenerator = d3.pie().value(d => d.value);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let arcData = pieGenerator(data);

    let slices = svg.selectAll("path")
        .data(arcData)
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => colors(i))
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("transform", "translate(0,0)")
        .attr("class", "pie-slice")
        .style("cursor", "pointer")
        .on("click", (_, d) => toggleFilter(d.data.label));

    // Render legend with interactive filtering
    let legendItems = legendContainer.selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .attr("style", (d, i) => `--color:${colors(i)}`)
        .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", (_, d) => toggleFilter(d.label));

    // Function to handle click event on slices and legend
    function toggleFilter(year) {
        if (selectedYear === year) {
            // If clicked again, reset filter
            selectedYear = null;
            updateProjects(projects);
            slices.style("opacity", 1); // Restore opacity for all slices
        } else {
            selectedYear = year;
            let filteredProjects = projects.filter(project => project.year === year);
            updateProjects(filteredProjects);
            slices.style("opacity", d => d.data.label === year ? 1 : 0.3); // Fade non-selected slices
        }
    }
}
// **Update opacity for non-selected slices**
function updateOpacity() {
    svg.selectAll("path").attr("opacity", d => selectedYear && d.data.label !== selectedYear ? 0.5 : 1);
}
