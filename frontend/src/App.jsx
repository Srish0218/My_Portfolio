import { useEffect, useState } from "react";
import "./App.css";

const DATA_URL = "/portfolio.json";
const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

function isImageDocument(document) {
  const declaredType = document.type?.toLowerCase().split("/").pop();
  const filePath = (document.url || "").split(/[?#]/)[0];
  const extension = filePath.split(".").pop().toLowerCase();
  return IMAGE_TYPES.has(declaredType || extension);
}

function App() {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [projectSearch, setProjectSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTopButton, setShowTopButton] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(null);
  const [achievementOpen, setAchievementOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load portfolio.json");
        return response.json();
      })
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Could not load portfolio data. Check that frontend/public/portfolio.json exists and contains valid JSON.",
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
  }, [profile, activeFilter, projectSearch]);

  useEffect(() => {
    const sectionIds = [
      "home",
      "about",
      "projects",
      "experience",
      "achievement",
      "skills",
      "education",
      "certificates",
      "contact",
    ];

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          )[0];

        if (visibleEntry) setActiveSection(visibleEntry.target.id);
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.2, 0.5, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));

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
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setResumeOpen(false);
        setActiveDocument(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!resumeOpen && !activeDocument) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [resumeOpen, activeDocument]);

  if (loadError) {
    return (
      <main className="app-message">
        <p>{loadError}</p>
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
  const getProjectTypes = (project) =>
    (Array.isArray(project.type) ? project.type : [project.type]).filter(Boolean);
  const collectSearchText = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(collectSearchText);
    if (typeof value === "object") return Object.values(value).flatMap(collectSearchText);
    return [String(value)];
  };
  const experience = profile.experience || [];
  const skills = profile.skills || [];
  const education = profile.education || [];
  const certificates = (profile.certificates || []).filter(
    (certificate) => certificate.file || certificate.url,
  );
  const visibleNavigation = navigation;

  const filters = [
    "All",
    ...new Set(projects.flatMap((project) => getProjectTypes(project))),
  ];

  const searchTerm = projectSearch.trim().toLowerCase();

  const visibleProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "All" || getProjectTypes(project).includes(activeFilter);

    const searchableText = [
      project.title,
      ...getProjectTypes(project),
      project.description,
      project.result,
      ...collectSearchText(project.tools),
      ...collectSearchText(project.skills),
      ...collectSearchText(project.skill),
      ...collectSearchText(project.technologies),
      ...collectSearchText(project.techStack),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesFilter && searchableText.includes(searchTerm);
  });

  const focusGroups = [
    {
      title: "Customer Experience Analytics",
      description:
        "Turning conversation data into insights that improve customer interactions.",
    },
    {
      title: "AI Product Development",
      description:
        "Creating practical tools such as AI career assistants and physics learning apps.",
    },
    {
      title: "Data Quality & Reporting",
      description:
        "Improving accuracy and making business data easier to evaluate and use.",
    },
  ];

  function closeMenu() {
    setMenuOpen(false);
  }

  function getSectionLabel(key, fallback) {
    const section = sections[key];

    if (typeof section === "string") return section;
    if (section?.label) {
      return section.label.split("/").slice(1).join("/").trim();
    }

    return fallback;
  }

  function getEmailUrl(email) {
    if (!email) return "";
    return email.startsWith("mailto:") ? email : `mailto:${email}`;
  }

  const contactLinks = (
    ui.contact?.socialLinks || [
      { key: "linkedin", label: "LinkedIn" },
      { key: "github", label: "GitHub" },
    ]
  ).filter((item) => item.key !== "email");

  return (
    <div className="site-shell">
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
          {visibleNavigation.map((item) => (
            <a
              className={activeSection === item.id ? "active" : ""}
              key={item.id}
              href={`#${item.id}`}
              aria-current={activeSection === item.id ? "location" : undefined}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}

          <a className="nav-contact" href="#contact" onClick={closeMenu}>
            {ui.navigationContact || "Contact"} <span aria-hidden="true">↗</span>
          </a>
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
              {links.resume && (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => setResumeOpen(true)}
                >
                  {ui.hero?.resumeButton || "View Resume"}
                </button>
              )}
            </div>
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

        {focusGroups.length > 0 && (
          <section className="focus-section" aria-label="Areas of focus">
            <p className="focus-label">AREAS OF FOCUS</p>
            <div className="focus-grid">
              {focusGroups.map((group, index) => (
                <article
                  className="focus-card"
                  key={`${group.title}-${index}`}
                >
                  <span className="focus-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="content-section about-section" id="about">
          <SectionHeading
            number="01"
            label={getSectionLabel("about", "About")}
            title="Curious about data. Focused on useful outcomes."
          />

          <div className="about-content reveal">
            <p>{profile.about}</p>
            <div className="about-links">
              {links.github && (
                <a href={links.github} target="_blank" rel="noopener noreferrer">
                  GitHub <span>↗</span>
                </a>
              )}
              {links.linkedin && (
                <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn <span>↗</span>
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="content-section projects-section" id="projects">
          <SectionHeading
            number="02"
            label={getSectionLabel("projects", "Projects")}
            title="Selected work"
          />

          <div className="project-search-row">
            <label className="project-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search projects, tools, or skills..."
                aria-label="Search projects"
              />
              {projectSearch && (
                <button
                  type="button"
                  onClick={() => setProjectSearch("")}
                  aria-label="Clear project search"
                >
                  Clear
                </button>
              )}
            </label>

            <span className="project-count" aria-live="polite">
              {visibleProjects.length} of {projects.length} projects
            </span>
          </div>

          <div className="project-filters" aria-label="Filter projects">
            {filters.map((filter) => (
              <button
                className={activeFilter === filter ? "active" : ""}
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
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
                  {getProjectTypes(project).map((type) => (
                    <span className="project-type" key={type}>
                      {type}
                    </span>
                  ))}
                  {project.featured && (
                    <span className="project-featured">Featured</span>
                  )}
                  <span className="project-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{project.title}</h3>
                {project.description && <p>{project.description}</p>}

                {project.result && (
                  <p className="project-result">{project.result}</p>
                )}

                {project.tools?.filter(Boolean).length > 0 && (
                  <div className="tag-list">
                    {project.tools.filter(Boolean).map((tool) => (
                      <span className="tag" key={tool}>
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {(project.githubUrl || project.url || project.liveUrl || project.documentationPdf) && (
                  <div className="project-links">
                    {(project.githubUrl || project.url) && (
                      <a
                        className="project-link"
                        href={project.githubUrl || project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub <span>↗</span>
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        className="project-link"
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Live project <span>↗</span>
                      </a>
                    )}
                    {project.documentationPdf && (
                      <button
                        className="project-link project-doc-button"
                        type="button"
                        onClick={() =>
                          setActiveDocument({
                            title: project.title,
                            url: project.documentationPdf,
                          })
                        }
                      >
                        View documentation <span>↗</span>
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}

            {visibleProjects.length === 0 && (
              <p className="empty-projects">
                No projects match “{projectSearch}”. Try another search or
                category.
              </p>
            )}
          </div>
        </section>

        <section className="content-section experience-section" id="experience">
          <SectionHeading
            number="03"
            label={getSectionLabel("experience", "Experience")}
            title="Where I’ve made a difference."
          />

          <div className="experience-list experience-timeline">
            {experience.map((job, index) => {
              const isOpen = activeExperienceIndex === index;
              const detailsId = `experience-details-${index}`;

              return (
                <article
                  className={`experience-item${isOpen ? " is-open" : ""}`}
                  key={`${job.company}-${index}`}
                  style={{ "--timeline-delay": `${index * 110}ms` }}
                >
                  <span className="experience-timeline-dot" aria-hidden="true" />
                  <button
                    className="experience-trigger"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={detailsId}
                    onClick={() =>
                      setActiveExperienceIndex(isOpen ? null : index)
                    }
                  >
                    <span className="experience-trigger-date">{job.dates}</span>
                    <span className="experience-trigger-main">
                      <span className="experience-trigger-role">{job.role}</span>
                      <span className="experience-trigger-company">{job.company}</span>
                    </span>
                    <span className="experience-trigger-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="experience-expanded" id={detailsId}>
                      {(job.location || job.employmentType || job.department) && (
                        <div className="experience-meta">
                          {job.location && <span>⌖ {job.location}</span>}
                          {job.employmentType && <span>{job.employmentType}</span>}
                          {job.department && <span>{job.department}</span>}
                        </div>
                      )}
                      {(job.points || []).length > 0 && (
                        <ul>
                          {job.points.map((point, pointIndex) => (
                            <li key={`${point}-${pointIndex}`}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {profile.achievement && (
          <section
            className="content-section achievement-section"
            id="achievement"
          >
            <SectionHeading
              number="04"
              label={getSectionLabel("achievement", "Achievement")}
              title="A moment worth celebrating."
            />

            <article className={`achievement-card${achievementOpen ? " is-open" : ""}`}>
              <button
                className="achievement-trigger"
                type="button"
                aria-expanded={achievementOpen}
                aria-controls="achievement-details"
                onClick={() => setAchievementOpen((open) => !open)}
              >
                <span className="achievement-badge">✦ Recognition</span>
                <span className="achievement-award">{profile.achievement.award}</span>
                <span className="achievement-card-title">{profile.achievement.title}</span>
                <span className="achievement-trigger-icon" aria-hidden="true">
                  {achievementOpen ? "−" : "+"}
                </span>
              </button>

              {achievementOpen && (
                <div className="achievement-expanded" id="achievement-details">
                  {profile.achievement.project && (
                    <p className="achievement-project">
                      {profile.achievement.project}
                    </p>
                  )}

                  {profile.achievement.description && (
                    <div className="achievement-description">
                      {profile.achievement.description
                        .split(/\n\s*\n/)
                        .filter(Boolean)
                        .map((block, index) => {
                          const lines = block.split("\n").filter(Boolean);
                          const bullets = lines
                            .filter((line) => line.trim().startsWith("•"))
                            .map((line) => line.trim().replace(/^•\s*/, ""));
                          const text = lines
                            .filter((line) => !line.trim().startsWith("•"))
                            .join(" ");

                          return (
                            <div key={index}>
                              {text && <p>{text}</p>}
                              {bullets.length > 0 && (
                                <ul>
                                  {bullets.map((bullet, bulletIndex) => (
                                    <li key={bulletIndex}>{bullet}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </article>
          </section>
        )}

        <section className="content-section skills-section" id="skills">
          <SectionHeading
            number="05"
            label={getSectionLabel("skills", "Skills")}
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
            label={getSectionLabel("education", "Education")}
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

        <section className="content-section certificates-section" id="certificates">
          <SectionHeading
            number="07"
            label={getSectionLabel("certificates", "Certificates")}
            title="Learning, recognized."
          />
          {certificates.length > 0 ? (
            <div className="certificates-grid">
              {certificates.map((certificate, index) => (
                <button
                  className="certificate-card reveal"
                  key={`${certificate.title}-${index}`}
                  style={{ "--reveal-delay": `${index * 80}ms` }}
                  type="button"
                  onClick={() =>
                    setActiveDocument({
                      title: certificate.title,
                      url: certificate.file || certificate.url,
                      isCertificate: true,
                      allowDownload: false,
                      type:
                        certificate.type ||
                        (certificate.file || certificate.url || "")
                          .split(/[?#]/)[0]
                          .split(".")
                          .pop()
                          .toLowerCase(),
                    })
                  }
                >
                  <span className="certificate-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="certificate-copy">
                    <strong>{certificate.title}</strong>
                    {(certificate.issuer || certificate.date) && (
                      <span className="certificate-meta">
                        {[certificate.issuer, certificate.date]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    {certificate.description && (
                      <span className="certificate-description">
                        {certificate.description}
                      </span>
                    )}
                  </span>
                  <span className="certificate-open" aria-hidden="true">
                    View certificate ↗
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="certificates-empty">
              Certificate previews will appear here.
            </p>
          )}
        </section>

        <section className="contact-section" id="contact">
  <div className="contact-card contact-card-pro reveal">
    <span className="contact-orb" aria-hidden="true" />

    <div className="contact-layout">
      <div className="contact-copy">
        <p className="eyebrow">
          {ui.contact?.intro ||
            "HAVE A QUESTION OR AN INTERESTING DATA CHALLENGE?"}
        </p>

        <h2>
          Let’s talk about
          <span> data, AI & meaningful work.</span>
        </h2>

        <p className="contact-description">
          {ui.contact?.description ||
            "I’m open to conversations about data, AI, and interesting opportunities."}
        </p>

        {links.email && (
          <a
            className="button button-primary contact-email"
            href={getEmailUrl(links.email)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ui.contact?.emailButton || "Email me"} <span>↗</span>
          </a>
        )}

        {profile.location && (
          <p className="contact-location">
            <span aria-hidden="true">⌖</span> {profile.location}
          </p>
        )}
      </div>

      <div className="contact-links-panel">
        <p className="contact-panel-label">CONNECT WITH ME</p>

        {contactLinks.map((item) => {
          const href = links[item.key];
          if (!href) return null;

          const description =
            item.key === "linkedin"
              ? "Professional profile"
              : item.key === "github"
                ? "Projects and code"
                : "Visit my profile";

          return (
            <a
              className="contact-profile-link"
              href={href}
              key={item.key}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-profile-icon" aria-hidden="true">
                {item.label.slice(0, 1)}
              </span>

              <span className="contact-profile-copy">
                <strong>{item.label}</strong>
                <small>{description}</small>
              </span>

              <span className="contact-profile-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  </div>
</section>
      </main>

      {resumeOpen && links.resume && (
        <div
          className="resume-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResumeOpen(false);
          }}
        >
          <section
            className="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-modal-title"
          >
            <header className="resume-modal-header">
              <div>
                <p className="resume-modal-kicker">RESUME PREVIEW</p>
                <h2 id="resume-modal-title">{profile.name}</h2>
              </div>
              <div className="resume-modal-actions">
                <a
                  className="button button-primary resume-download"
                  href={links.resume}
                  download="Srishti-Jaitly-Resume.pdf"
                >
                  Download Resume <span aria-hidden="true">↓</span>
                </a>
                <button
                  className="resume-modal-close"
                  type="button"
                  onClick={() => setResumeOpen(false)}
                  aria-label="Close resume preview"
                >
                  ×
                </button>
              </div>
            </header>
            <iframe
              className="resume-preview-frame"
              src={links.resume}
              title={`${profile.name} resume PDF`}
            />
          </section>
        </div>
      )}

      {activeDocument && (
        <div
          className="resume-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveDocument(null);
          }}
        >
          <section
            className="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-document-title"
          >
            <header className="resume-modal-header">
              <div>
                <p className="resume-modal-kicker">
                  {activeDocument.isCertificate
                    ? "CERTIFICATE PREVIEW"
                    : activeDocument.type?.toLowerCase().includes("pdf")
                      ? "DOCUMENT PREVIEW"
                      : "PROJECT DOCUMENTATION"}
                </p>
                <h2 id="project-document-title">{activeDocument.title}</h2>
              </div>
              <div className="resume-modal-actions">
                {activeDocument.allowDownload !== false && (
                  <a
                    className="button button-primary resume-download"
                    href={activeDocument.url}
                    download
                  >
                    Download file <span aria-hidden="true">↓</span>
                  </a>
                )}
                <button
                  className="resume-modal-close"
                  type="button"
                  onClick={() => setActiveDocument(null)}
                  aria-label="Close project documentation"
                >
                  ×
                </button>
              </div>
            </header>
            {isImageDocument(activeDocument) ? (
              <div
                className="document-image-viewer"
                onContextMenu={(event) => event.preventDefault()}
              >
                <img
                  src={activeDocument.url}
                  alt={`${activeDocument.title} certificate`}
                  draggable="false"
                  onContextMenu={(event) => event.preventDefault()}
                />
              </div>
            ) : (
              <iframe
                className="resume-preview-frame"
                src={
                  activeDocument.isCertificate
                    ? `${activeDocument.url}#toolbar=0&navpanes=0&scrollbar=0`
                    : activeDocument.url
                }
                title={`${activeDocument.title} document preview`}
              />
            )}
          </section>
        </div>
      )}

      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{branding.subtitle || "DATA · AI · AUTOMATION"}</span>
        {links.github && (
          <a href={links.github} target="_blank" rel="noopener noreferrer">
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
        <span>
          {number} / {label}
        </span>
        <i />
      </div>
      <h2>{title}</h2>
    </div>
  );
}

export default App;
