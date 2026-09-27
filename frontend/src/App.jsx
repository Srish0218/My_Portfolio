import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [profile, setProfile] = useState(null);
  const [apiError, setApiError] = useState("");
  const [filter, setFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  // Load portfolio content from the Python API.
  useEffect(() => {
    let cancelled = false;

    fetch("http://127.0.0.1:8000/api/portfolio")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Portfolio API request failed");
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) {
          setApiError(
            "Could not connect to the portfolio API. Check that the Python server is running."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Animate marked elements when they scroll into view.
  useEffect(() => {
    if (!profile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".animate-in").forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [profile]);

  // Update the reading progress bar and back-to-top button while scrolling.
  useEffect(() => {
    const updateScroll = () => {
      const pageHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      setScrollProgress(pageHeight > 0 ? window.scrollY / pageHeight : 0);
      setShowTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  if (!profile) {
    return (
      <main className="api-message">
        <p>{apiError || "Connecting to your portfolio…"}</p>
        {apiError && (
          <button onClick={() => window.location.reload()}>Try again</button>
        )}
      </main>
    );
  }

  const projects = profile.projects || [];
  const visibleProjects =
    filter === "All"
      ? projects
      : projects.filter((project) => project.type === filter);

  const navItems = [
    "About",
    "Projects",
    "Experience",
    "Achievement",
    "Skills",
    "Education",
  ];

  return (
    <div className={darkMode ? "site-shell dark-theme" : "site-shell"}>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark">SJ</span>
          <span>
            {profile.name}
            <small>DATA · AI · AUTOMATION</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav className={menuOpen ? "navigation navigation-open" : "navigation"}>
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <a
            className="nav-contact"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            Contact ↗
          </a>
        </nav>

        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={`Switch to ${darkMode ? "light" : "dark"} theme`}
        >
          {darkMode ? "☀" : "☾"}
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy animate-in">
            <p className="eyebrow">{profile.role} · LUDHIANA, INDIA</p>
            <h1>
              Hi, I’m
              <br />
              <em>{profile.name.split(" ")[0]}.</em>
            </h1>
            <p className="hero-description">{profile.about}</p>

            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                Explore my work ↓
              </a>
              <a
                className="button button-secondary"
                href="https://drive.google.com/drive/u/0/folders/17ThnbVthhsvUSbwZK4zU5PRvqfSZk90W"
                target="_blank"
                rel="noreferrer"
              >
                View résumé ↗
              </a>
            </div>
          </div>

          <div
            className="hero-art animate-in"
            aria-label="Srishti Jaitly initials illustration"
          >
            <div className="art-ring art-ring-one" />
            <div className="art-ring art-ring-two" />
            <div className="art-monogram">
              SJ<span>✳</span>
            </div>
            <p>
              CURIOUS BY NATURE
              <br />
              ANALYTICAL BY CHOICE
            </p>
          </div>

          <div className="hero-stats animate-in">
            <div>
              <strong>30%</strong>
              <span>faster data processing</span>
            </div>
            <div>
              <strong>60%</strong>
              <span>less manual effort</span>
            </div>
            <div>
              <strong>1st</strong>
              <span>AI festival winner</span>
            </div>
          </div>
        </section>

        <section className="content-section about-section" id="about">
          <p className="section-label">01 / ABOUT</p>
          <div className="about-grid animate-in">
            <h2>
              Curious by nature.
              <br />
              <em>Analytical by choice.</em>
            </h2>
            <p>{profile.about}</p>
          </div>
        </section>

        <section className="content-section projects-section" id="projects">
          <p className="section-label">02 / SELECTED WORK</p>
          <div className="section-heading animate-in">
            <h2>
              Projects with
              <br />
              <em>a purpose.</em>
            </h2>
            <p>A few ways I’ve used data and AI to solve practical problems.</p>
          </div>

          <div className="project-filters">
            {["All", "AI", "Automation"].map((item) => (
              <button
                key={item}
                className={filter === item ? "filter-active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="project-grid">
            {visibleProjects.map((project, index) => (
              <article
                className="project-card animate-in"
                key={project.title}
              >
                <div className={`project-art project-art-${index + 1}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{project.type === "AI" ? "✳" : "↗"}</strong>
                </div>

                <div className="project-info">
                  <p className="project-type">{project.type} PROJECT</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <p className="project-result">{project.result}</p>

                  <div className="tag-list">
                    {(project.tools || []).map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                  </div>

                  <a
                    href="https://github.com/SrishtiJaitly"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Find it on GitHub ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section experience-section" id="experience">
          <p className="section-label">03 / EXPERIENCE</p>
          <div className="section-heading animate-in">
            <h2>
              Where I’ve
              <br />
              <em>made a difference.</em>
            </h2>
          </div>

          <div className="timeline">
            {(profile.experience || []).map((job) => (
              <article className="job animate-in" key={job.company}>
                <p className="job-dates">{job.dates}</p>
                <div>
                  <p className="job-company">{job.company}</p>
                  <h3>{job.role}</h3>
                  <ul>
                    {job.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="achievement-section" id="achievement">
          <p className="section-label">04 / ACHIEVEMENT</p>
          <p className="award-badge animate-in">
            {profile.achievement.award}
          </p>
          <h2 className="animate-in">{profile.achievement.title}</h2>
          <p className="animate-in">
            Winning project: “{profile.achievement.project}”
          </p>
        </section>

        <section className="content-section skills-section" id="skills">
          <p className="section-label">05 / TOOLKIT</p>
          <div className="section-heading animate-in">
            <h2>
              Tools I use
              <br />
              <em>to make things.</em>
            </h2>
          </div>

          <div className="skills-grid">
            {(profile.skills || []).map((group) => (
              <article className="skill-card animate-in" key={group.title}>
                <h3>{group.title}</h3>
                <div className="tag-list">
                  {group.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section education-section" id="education">
          <p className="section-label">06 / EDUCATION</p>

          {(profile.education || []).map((item) => (
            <article className="education-item animate-in" key={item.school}>
              <div>
                <h3>{item.degree}</h3>
                <p>
                  {item.school} · {item.place}
                </p>
              </div>
              <span>{item.dates}</span>
            </article>
          ))}
        </section>

        <section className="contact-section" id="contact">
          <p className="section-label">07 / LET’S CONNECT</p>
          <h2 className="animate-in">
            Let’s make
            <br />
            <em>something useful.</em>
          </h2>

          <a
            className="button button-light"
            href="mailto:srishtijaitly2002@gmail.com"
          >
            Email me ↗
          </a>

          <div className="social-links">
            <a href="mailto:srishtijaitly2002@gmail.com">Email</a>
            <a
              href="https://www.linkedin.com/in/Srishti-Jaitly/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              href="https://github.com/SrishtiJaitly"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#home">
          <span className="brand-mark">SJ</span>
          <span>
            {profile.name}
            <small>DATA · AI · AUTOMATION</small>
          </span>
        </a>
        <p>Designed with curiosity · © {new Date().getFullYear()}</p>
        <a href="#home">Back to top ↑</a>
      </footer>

      {showTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;