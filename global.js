console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

function createNavigationMenu() {
    let pages = [
        { url: "", title: "Home" },
        { url: "projects/", title: "Projects" },
        { url: "contact/", title: "Contact" },
        { url: "resume/", title: "Resume" },
        { url: "https://github.com/waleung1231", title: "GitHub" },
    ];

    const ARE_WE_HOME = document.documentElement.classList.contains("home");

    let nav = document.createElement("nav");
    document.body.prepend(nav);

    for (let p of pages) {
        let url = p.url;
        let title = p.title;

        url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;

        let a = document.createElement("a");
        a.href = url;
        a.textContent = title;

        a.classList.toggle(
            "current",
            a.host === location.host && a.pathname === location.pathname
        );

        if (a.host !== location.host) {
            a.target = "_blank";
        }

        nav.append(a);
    }
}

function createThemeSwitcher() {
    document.body.insertAdjacentHTML(
        "afterbegin",
        `
        <label class="color-scheme">
            Theme:
            <select>
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>`
    );

    const select = document.querySelector(".color-scheme select");
    const root = document.documentElement;


    if ("colorScheme" in localStorage) {
        setColorScheme(localStorage.colorScheme);
        select.value = localStorage.colorScheme;
    }

    select.addEventListener("input", function (event) {
        const selectedScheme = event.target.value;
        setColorScheme(selectedScheme);
        localStorage.colorScheme = selectedScheme; 
    });


    function setColorScheme(colorScheme) {
        const root = document.documentElement;
        root.style.setProperty("color-scheme", colorScheme);
    
        // Optional: Dynamically adapt body background and text
        document.body.style.backgroundColor = colorScheme === "dark" ? "black" : "white";
        document.body.style.color = colorScheme === "dark" ? "white" : "black";
    
        // Update article boxes for light and dark modes
        const articles = document.querySelectorAll("article");
        articles.forEach((article) => {
            article.style.backgroundColor = colorScheme === "dark" ? "#1c1c1c" : "white";
            article.style.color = colorScheme === "dark" ? "white" : "black";
        });
    }
    
}



createNavigationMenu();
createThemeSwitcher();

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        console.log(response);

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}


export function renderProjects(project, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error("Invalid container element provided.");
        return;
    }

    const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadingLevels.includes(headingLevel)) {
        console.warn(`Invalid heading level '${headingLevel}' provided. Defaulting to 'h2'.`);
        headingLevel = 'h2';
    }

    // Create article container
    const article = document.createElement('article');

    // Title
    const title = document.createElement(headingLevel);
    title.textContent = project.title;
    article.appendChild(title);

    // Image
    const img = document.createElement('img');
    img.src = project.image || "https://vis-society.github.io/labs/2/images/empty.svg"; // Default if missing
    img.alt = project.title;
    article.appendChild(img);

    // Description
    const description = document.createElement('p');
    description.textContent = project.description;
    article.appendChild(description);

    // Year (New)
    if (project.year) {
        const year = document.createElement('p');
        year.textContent = `Year: ${project.year}`;
        year.style.fontWeight = "bold";
        year.style.color = "var(--color-accent)";
        article.appendChild(year);
    }

    // GitHub Link
    if (project.github) {
        const link = document.createElement('a');
        link.href = project.github;
        link.textContent = 'GitHub Link';
        link.target = '_blank';
        article.appendChild(link);
    }

    containerElement.appendChild(article);
}



export async function fetchGitHubData(username) {
    try {
        return await fetchJSON(`https://api.github.com/users/${username}`);
    } catch (error) {
        console.error("Error fetching GitHub data:", error);
    }
}
