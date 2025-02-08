import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Select elements from the DOM
const projectsTitle = document.querySelector('.projects-title');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const svg = d3.select("#projects-pie-plot");
const legendContainer = d3.select('.legend');

let projects = [];
let selectedYear = null; 
let query = ''; 


fetchJSON('../lib/projects.json')
    .then(fetchedProjects => {
        console.log("Fetched Projects:", fetchedProjects);
        projects = fetchedProjects;
        updateProjects(projects);
        renderPieChart(projects); 
    })
    .catch(error => console.error("Error loading projects:", error));


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


function updateProjects(filteredProjects) {
    projectsContainer.innerHTML = ''; 
    if (projectsTitle) projectsTitle.textContent = `Projects (${filteredProjects.length})`;

    if (filteredProjects.length === 0) {
        projectsContainer.innerHTML = "<p>No projects available.</p>";
    } else {
        filteredProjects.forEach(project => renderProjects(project, projectsContainer, 'h2'));
    }
}


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

    let legendItems = legendContainer.selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .attr("style", (d, i) => `--color:${colors(i)}`)
        .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", (_, d) => toggleFilter(d.label));

    function toggleFilter(year) {
        if (selectedYear === year) {

            selectedYear = null;
            updateProjects(projects);
            slices.style("opacity", 1); 
        } else {
            selectedYear = year;
            let filteredProjects = projects.filter(project => project.year === year);
            updateProjects(filteredProjects);
            slices.style("opacity", d => d.data.label === year ? 1 : 0.3); 
        }
    }
}

function updateOpacity() {
    svg.selectAll("path").attr("opacity", d => selectedYear && d.data.label !== selectedYear ? 0.5 : 1);
}
