import { fetchGitHubData, fetchJSON, renderProjects } from './global.js';
// Select the container for displaying the latest projects
const projectsContainer = document.querySelector('.projects');
if (projectsContainer) {
    fetchJSON('./lib/projects.json')
        .then(projects => {
            if (!projects || projects.length === 0) {
                console.warn("No projects found in JSON file.");
                projectsContainer.innerHTML = "<p>No recent projects available.</p>";
                return;
            }

            // Get the first 3 projects
            const latestProjects = projects.slice(0, 3);

            // Render each of the latest projects
            latestProjects.forEach(project => renderProjects(project, projectsContainer, 'h2'));
        })
        .catch(error => console.error("Error fetching latest projects:", error));
} else {
    console.error("No container found for latest projects. Make sure there's a <div class='projects'> in index.html.");
}



// Select the profile stats container
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    fetchGitHubData('waleung1231') // Using your GitHub username
        .then(githubData => {
            if (!githubData) {
                profileStats.innerHTML = "<p>Error loading GitHub data.</p>";
                return;
            }

            // Dynamically insert data into the HTML
            profileStats.innerHTML = `
                <h2>GitHub Stats</h2>
                <dl>
                    <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                    <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                    <dt>Followers:</dt><dd>${githubData.followers}</dd>
                    <dt>Following:</dt><dd>${githubData.following}</dd>
                </dl>
            `;
        })
        .catch(error => {
            console.error("GitHub API Error:", error);
            profileStats.innerHTML = "<p>Failed to load GitHub stats.</p>";
        });
} else {
    console.error("No container found for GitHub stats. Make sure there's a <div id='profile-stats'> in index.html.");
}
