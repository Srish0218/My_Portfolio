import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://my-portfolio-s5rd.onrender.com/api/portfolio";

function App() {
  const [profile, setProfile] = useState(null);
  const [apiError, setApiError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Portfolio request failed");
        }
        return response.json();
      })
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch(() => {
        if (isMounted) {
          setApiError(
            "Could not load the portfolio. Check that the Python API is running.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function updateScroll() {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

      setScrollProgress(progress);
      setShowTopButton(window.scrollY > 500);
    }

    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [profile]);

  useEffect(() => {
    function showClickRipple(event) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;

      document.body.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
    }

    document.addEventListener("click", showClickRipple);

    return () => document.removeEventListener("click", showClickRipple);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light-theme", lightTheme);

    return () => document.body.classList.remove("light-theme");
  }, [lightTheme]);

  if (apiError) {
    return (
      <main className="app-message">
        <p>{apiError}</p>
        <p>
          Start your backend, then refresh this page. The API address is{" "}
          <code>{API_URL}</code>.
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="app-message loading-message">
        <span className="loading-orb" aria-hidden="true" />
        <p>Loading portfolio…</p>
      </main>
    );
  }

  const ui = profile.ui || {};
  const links = profile.links || {};
  const branding = profile.branding || {};
  const navigation = ui.navigation || [];
  const sections = ui.sections || {};
  const projects = profile.projects || [];
  const experience = profile.experience || [];
  const skills = profile.skills || [];
  const education = profile.education || [];
  const stats = profile.stats || [];

  const filters = [
    "All",
    ...new Set(projects.map((project) => project.type).filter(Boolean)),
  ];

  const visibleProjects =
    activeFilter === "All"
      ? projects
      : projects.filter((project) => project.type === activeFilter);

  function closeMenu() {
    setMenuOpen(false);
  }

function sectionTitle(key, fallback) {
  const section = sections[key];

  if (typeof section === "string") return section;

  // Your JSON labels look like "03 / EXPERIENCE".
  if (section?.label) {
    return section.label.split("/").slice(1).join("/").trim();
  }

  return fallback;
}

  return (
    <div className={`site-shell${lightTheme ? " light-theme" : ""}`}>
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
        aria-hidden="true"
      />

      <header className="site-header">
        <a className="brand" href="#home" onClick={closeMenu}>
          <span className="brand-mark">{branding.monogram || "SJ"}</span>
          <span className="brand-copy">
            <strong>{profile.name}</strong>
            <small>{branding.subtitle || "DATA · AI · AUTOMATION"}</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={`site-nav${menuOpen ? " is-open" : ""}`}>
          {navigation.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={closeMenu}>
              {item.label}
            </a>
          ))}

          <a className="nav-contact" href="#contact" onClick={closeMenu}>
            {ui.navigationContact || "Contact"} <span aria-hidden="true">↗</span>
          </a>

          <button
            className="theme-toggle"
            type="button"
            onClick={() => setLightTheme((current) => !current)}
            aria-label={lightTheme ? "Switch to dark theme" : "Switch to light theme"}
          >
            {lightTheme ? "☾" : "☼"}
          </button>
        </nav>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              {profile.role}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>

            <h1>
              {ui.hero?.greeting || "Hi, I’m"}
              <span>{profile.name?.split(" ")[0] || profile.name}.</span>
            </h1>

            <p className="hero-description">{profile.about}</p>

            <div className="hero-actions">
              <a className="button button-primary" href="#projects">
                {ui.hero?.primaryButton || "Explore my work"} <span>↓</span>
              </a>

              {links.resume && (
                <a
                  className="button button-secondary"
                  href={links.resume}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ui.hero?.resumeButton || "View résumé"} <span>↗</span>
                </a>
              )}
            </div>

            {stats.length > 0 && (
              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div className="stat-item" key={`${stat.value}-${index}`}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="art-glow" />
            <div className="art-monogram">
              <span>{branding.monogram || "SJ"}</span>
            </div>
            <span className="art-star">✳</span>
            <span className="art-caption">
              {branding.homeLabel || "DATA · AI · AUTOMATION"}
            </span>
          </div>
        </section>

        <section className="content-section about-section" id="about">
          <SectionHeading
            number="01"
            label={sectionTitle("about", "About")}
            title="Curious about data. Focused on useful outcomes."
          />
          <div className="about-content reveal">
            <p>{profile.about}</p>
            <div className="about-links">
              {links.github && (
                <a href={links.github} target="_blank" rel="noreferrer">
                  GitHub <span>↗</span>
                </a>
              )}
              {links.linkedin && (
                <a href={links.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <span>↗</span>
                </a>
              )}
              {links.email && (
                <a href={links.email}>
                  Email <span>↗</span>
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="content-section projects-section" id="projects">
          <SectionHeading
            number="02"
            label={sectionTitle("projects", "Projects")}
            title="Selected work"
          />

          <div className="project-filters" aria-label="Filter projects">
            {filters.map((filter) => (
              <button
                className={activeFilter === filter ? "active" : ""}
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="projects-grid">
            {visibleProjects.map((project, index) => (
              <article
                className="project-card reveal"
                key={`${project.title}-${index}`}
                style={{ "--reveal-delay": `${index * 90}ms` }}
              >
                <div className="project-card-top">
                  <span className="project-type">{project.type}</span>
                  <span className="project-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{project.title}</h3>
                <p>{project.description}</p>

                {project.result && (
                  <p className="project-result">{project.result}</p>
                )}

                {project.tools?.length > 0 && (
                  <div className="tag-list">
                    {project.tools.map((tool) => (
                      <span className="tag" key={tool}>
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {project.url && (
                  <a
                    className="project-link"
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${project.title}`}
                  >
                    View project <span>↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="content-section experience-section" id="experience">
          <SectionHeading
            number="03"
            label={sectionTitle("experience", "Experience")}
            title="Where I’ve made a difference."
          />

          <div className="experience-list">
            {experience.map((job, index) => (
              <article
                className="experience-card reveal"
                key={`${job.company}-${index}`}
                style={{ "--reveal-delay": `${index * 100}ms` }}
              >
                <div className="experience-date">{job.dates}</div>
                <div className="experience-details">
                  <p className="experience-company">{job.company}</p>
                  <h3>{job.role}</h3>
                  <ul>
                    {(job.points || []).map((point, pointIndex) => (
                      <li key={`${point}-${pointIndex}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {profile.achievement && (
          <section className="content-section achievement-section" id="achievement">
            <SectionHeading
              number="04"
              label={sectionTitle("achievement", "Achievement")}
              title="A moment worth celebrating."
            />

            <article className="achievement-card reveal">
              <span className="achievement-badge">✦ Recognition</span>
              <p className="achievement-award">{profile.achievement.award}</p>
              <h3>{profile.achievement.title}</h3>
              {profile.achievement.project && (
                <p>{profile.achievement.project}</p>
              )}
              {profile.achievement.description && (
                <p>{profile.achievement.description}</p>
              )}
            </article>
          </section>
        )}

        <section className="content-section skills-section" id="skills">
          <SectionHeading
            number="05"
            label={sectionTitle("skills", "Skills")}
            title="Tools I work with"
          />

          <div className="skills-grid">
            {skills.map((group, index) => (
              <article
                className="skill-card reveal"
                key={`${group.title}-${index}`}
                style={{ "--reveal-delay": `${index * 80}ms` }}
              >
                <h3>{group.title}</h3>
                <div className="tag-list">
                  {(group.skills || []).map((skill) => (
                    <span className="tag" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section education-section" id="education">
          <SectionHeading
            number="06"
            label={sectionTitle("education", "Education")}
            title="Learning that shaped my work"
          />

          <div className="education-list">
            {education.map((item, index) => (
              <article
                className="education-card reveal"
                key={`${item.school}-${index}`}
                style={{ "--reveal-delay": `${index * 80}ms` }}
              >
                <div>
                  <h3>{item.degree}</h3>
                  <p>{item.school}</p>
                </div>
                <div className="education-meta">
                  <span>{item.place}</span>
                  <span>{item.dates}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="contact-section" id="contact">
  <div className="contact-card reveal">
    <span className="contact-orb" aria-hidden="true" />

    <p className="eyebrow">
      {ui.contact?.intro || "HAVE A QUESTION OR AN INTERESTING DATA CHALLENGE?"}
    </p>

    <h2>
      {ui.contact?.titleLineOne || "Let’s make"}
      <span>{ui.contact?.titleLineTwo || "something useful."}</span>
    </h2>

    <p className="contact-description">
      {ui.contact?.description ||
        "I’m open to conversations about data, AI, and interesting opportunities."}
    </p>

    {links.email && (
      <a className="button button-primary contact-email" href={`mailto:${links.email.replace(/^mailto:/, "")}`}>
        {ui.contact?.emailButton || "Email me"} <span>↗</span>
      </a>
    )}

    <div className="contact-socials">
      {(ui.contact?.socialLinks || [
        { key: "email", label: "Email" },
        { key: "linkedin", label: "LinkedIn" },
        { key: "github", label: "GitHub" },
      ]).map((item) => {
        const href =
          item.key === "email"
            ? links.email
              ? `mailto:${links.email.replace(/^mailto:/, "")}`
              : ""
            : links[item.key];

        return href ? (
          <a
            className="contact-social-link"
            href={href}
            key={item.key}
            target={item.key === "email" ? undefined : "_blank"}
            rel={item.key === "email" ? undefined : "noreferrer"}
          >
            {item.label} <span aria-hidden="true">↗</span>
          </a>
        ) : null;
      })}
    </div>
  </div>
</section>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>{branding.subtitle || "DATA · AI · AUTOMATION"}</span>
        {links.github && (
          <a href={links.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        )}
      </footer>

      {showTopButton && (
        <button
          className="back-to-top"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

function SectionHeading({ number, label, title }) {
  return (
    <div className="section-heading reveal">
      <div className="section-kicker">
        <span>{number} / {label}</span>
        <i />
      </div>
      <h2>{title}</h2>
    </div>
  );
}

export default App;