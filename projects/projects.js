import { fetchJSON, renderProjects } from '../global.js';

// Select elements from the DOM
const projectsTitle = document.querySelector('.projects-title');
const projectsContainer = document.querySelector('.projects');

fetchJSON('../lib/projects.json')
    .then(projects => {
        if (!projects || projects.length === 0) {
            console.warn("No projects found in JSON file.");
            displayNoProjectsMessage();
            if (projectsTitle) projectsTitle.textContent = "Projects (0)";
            return;
        }

        // Clear the container **once** before adding projects
        projectsContainer.innerHTML = '';

        // Update the title with the project count
        if (projectsTitle) projectsTitle.textContent = `Projects (${projects.length})`;

        // Render each project
        projects.forEach(project => renderProjects(project, projectsContainer, 'h2'));
    })
    .catch(error => console.error("Error loading projects:", error));

function displayNoProjectsMessage() {
    if (projectsContainer) projectsContainer.innerHTML = "<p>No projects available at the moment.</p>";
}

