import { Header } from "@/components/Header";
import { ContactDock } from "@/components/ContactDock";
import { BackdropOptics } from "@/components/BackdropOptics";
import { AmbientGlass } from "@/components/AmbientGlass";
import { RefractiveSurface } from "@/components/RefractiveSurface";
import { ProjectCard } from "@/components/ProjectCard";
import { Skills } from "@/components/Skills";
import { ThemeControl } from "@/components/ThemeControl";
import { CredentialCard } from "@/components/CredentialCard";
import { featuredProjects, otherProjects } from "@/data/portfolio";



function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow"><span className="mono">{index}</span>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export default function Home() {

  function animateIndexRL(index: number) {
    if (index % 2 === 0) {
      return `fade-right`;
    } else {
      return `fade-left`;
    }
  }

    function animateIndexUD(index: number) {
    if (index % 2 === 0) {
      return `fade-up`;
    } else {
      return `fade-down`;
    }
  }

  return (
    <>
      <BackdropOptics />
      <AmbientGlass />
      <div data-aos="fade-down" className="project-aos-wrapper">
        <Header />
      </div>
      <main>
        <section className="hero page-width" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="availability" data-aos="fade-right">
              <span className="status-dot" />
              Open to Software Engineering Opportunities
            </p>
            <p className="hero-kicker mono" data-aos="fade-right">FULL-STACK DEVELOPER <span>/</span> DEVELOPER TOOLS ENGINEER <span>/</span> CREATIVE TECHNOLOGIST</p>
            <h1 id="hero-title" data-aos="fade-left">
              Keegan
              <br />
              <span>LaBrot</span>
            </h1>
            <h2 className="hero-tagline" data-aos="fade-up">Building intuitive experiences for complex systems.</h2>
            <p className="hero-description" data-aos="fade-up">
              I&apos;m a multidisciplinary software developer specializing in
              interactive web applications, developer tools, and systems
              engineering. From polished React interfaces to binary inspection
              tools and GPU-driven simulations, I enjoy turning complicated
              ideas into functional, intuitive software.
            </p>
            <div className="hero-actions">
              <a data-aos="zoom-in" className="button button-primary" href="#projects">Explore projects <span aria-hidden="true">↓</span></a>
              <a data-aos="zoom-in" className="button button-secondary" href="https://github.com/RegionZeroProcedural" target="_blank" rel="noreferrer">View GitHub <span aria-hidden="true">↗</span></a>
              <a data-aos="zoom-in" className="button button-quiet" href="#experience">Experience</a>
            </div>
            <p className="hero-location mono" data-aos="fade-up"><span className="location-mark" aria-hidden="true">⌖</span> FARMINGTON, MISSOURI <span className="location-divider">·</span> BUILDING FROM IDEA TO IMPLEMENTATION</p>
          </div>
          <div data-aos="zoom-in" className="hero-visual" role="img" aria-label="Illustration of connected engineering disciplines">
            <div className="visual-topline mono"><span>SYSTEM MAP</span><span className="live-indicator"><i /> ARCHITECTURE MAP</span></div>
            <svg className="system-lines" viewBox="0 0 600 450" fill="none" aria-hidden="true">
              <path d="M300 226 153 126M300 226l147-100M300 226 145 326M300 226l155 100M153 126l-31 185M447 126l31 185M153 126l294 0M145 326l310 0" />
              <path className="flow-line" d="M300 226 153 126M300 226l147-100M300 226 145 326M300 226l155 100" />
              <circle cx="153" cy="126" r="4" /><circle cx="447" cy="126" r="4" />
              <circle cx="145" cy="326" r="4" /><circle cx="455" cy="326" r="4" />
            </svg>
            <div className="visual-orbit orbit-outer" />
            <div className="visual-orbit orbit-inner" />
            <div className="visual-core"><span className="core-glyph">λ</span><span className="mono">EXECUTION<br />CORE</span></div>
            <div className="visual-node node-ui"><span className="node-glyph">◫</span><strong>INTERFACE</strong><small>React · Next.js</small></div>
            <div className="visual-node node-tools"><span className="node-glyph">⌘</span><strong>DEV TOOLS</strong><small>Inspect · Debug</small></div>
            <div className="visual-node node-systems"><span className="node-glyph">⌬</span><strong>SYSTEMS</strong><small>Binary · GPU</small></div>
            <div className="visual-node node-graphics"><span className="node-glyph">◉</span><strong>GRAPHICS</strong><small>Unity · HLSL</small></div>
            <div className="visual-readout mono"><span>MODULES</span><strong>04</strong><span>CONNECTIONS</span><strong>08</strong></div>
            <div className="visual-footer mono"><span>INPUT <b>IDEA</b></span><span>OUTPUT <b>UNDERSTANDING</b></span></div>
          </div>
          <div className="hero-scroll mono"><span data-aos="zoom-in">01 — 06</span><a href="#projects" data-aos="zoom-in">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div>
        </section>

        <section data-aos="fade-down" className="section page-width projects-section" id="projects" aria-labelledby="projects-title">
          <SectionHeading  index="01" eyebrow="Selected work" title="Tools for making sense of complexity." description="A selection of interactive applications, developer tools, and technical experiments. Each one starts with a problem worth understanding." />
          <div className="featured-projects">
            {featuredProjects.map((project, index) => (
              <div className="project-aos-wrapper" data-aos={animateIndexRL(index)} key={project.name}>
                <ProjectCard key={project.name} project={project} index={index} />
              </div>
            ))}
          </div>
        </section>

        <section data-aos="fade-down" className="section page-width experiments-section" aria-labelledby="experiments-title">
          <SectionHeading index="02" eyebrow="More in the workshop" title="Other experiments." description="Smaller explorations in product thinking, networking, civic technology, and source analysis." />
          <div className="experiment-grid">
            {otherProjects.map((project, index) => (
              <article data-aos={animateIndexUD(index)} className="experiment-card glass-panel" key={`${project.name}-${index}`}>
                <span className="experiment-icon" aria-hidden="true">{project.glyph}</span>
                <p className="eyebrow">{project.category}</p>
                <h3>{project.name}</h3>
                <p className="experiment-description">{project.description}</p>
                <ul className="tag-list" aria-label={`${project.name} technologies`}>
                  {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section page-width skills-section" id="skills" aria-labelledby="skills-title">
          <div data-aos="fade-left" className="project-aos-wrapper">
            <SectionHeading index="03" eyebrow="Technical toolkit" title="A wide-angle view of software." description="I work across interfaces, services, systems, and graphics. Explore the disciplines and tools I’ve used to bring projects to life." />
          </div>
          <div data-aos="fade-right" className="project-aos-wrapper">
            <Skills />
          </div>
        </section>

        <section className="section page-width experience-section" id="experience" aria-labelledby="experience-title">
          <div data-aos="fade-down" className="project-aos-wrapper">
            <SectionHeading index="04" eyebrow="Experience & background" title="A path built through practice." description="My software background is rooted in independent learning and project development, alongside hands-on work in structured, people-facing roles." />
          </div>
          <div className="experience-columns">
            <div className="experience-column technical-experience">
              <p data-aos="fade-left" className="column-label mono"><span>01</span> SOFTWARE & TRAINING</p>
              <article data-aos="zoom-in" className="experience-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Independent Software Developer</h3><span>2011 — Present</span></div>
                <p className="experience-subtitle">Independent learning & project development</p>
                <p>I began programming around age 12 and have spent approximately 15 years independently learning, experimenting, and developing software. This reflects independent development experience, not 15 years of professional software employment.</p>
                <ul className="experience-points">
                  <li>Designing full-stack applications and original software prototypes</li>
                  <li>Building developer tools, reusable React components, and REST API integrations</li>
                  <li>Exploring graphics and systems programming, debugging, deployment, and Git workflows</li>
                </ul>
              </article>
              <article data-aos="zoom-in" className="experience-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Frontend Simplified</h3><span>Training & projects</span></div>
                <p className="experience-subtitle">Frontend development training & project-based experience</p>
                <p>Completed frontend development training with practical React work, API integration, responsive interfaces, and Git-based development workflows. NFT marketplace development is described as project-based training experience.</p>
              </article>
              <article data-aos="zoom-in" className="experience-item upcoming-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Skinstric AI</h3><span>Preparing to begin</span></div>
                <p>Preparing to begin an internship through Frontend Simplified. This opportunity has not yet started.</p>
              </article>
            </div>

            <div className="experience-column broader-experience">
              <p data-aos="fade-left" className="column-label mono"><span>02</span> PROFESSIONAL & OTHER WORK</p>
              <article data-aos="zoom-in" className="experience-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Advance Auto Parts</h3><span>Retail Parts Pro / Assistant Manager</span></div>
                <p>Supported day-to-day retail operations, inventory organization, customer questions about technical products, and team workflows. Built transferable strengths in accountability, organization, and practical problem-solving.</p>
              </article>
              <article data-aos="zoom-in" className="experience-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Corrections Officer</h3><span>Public safety</span></div>
                <p>Worked within structured procedures, maintained accurate documentation, exercised situational judgment, and communicated under pressure while following safety protocols.</p>
              </article>
              <article data-aos="zoom-in" className="experience-item">
                <span className="timeline-dot" />
                <div className="experience-heading"><h3>Lifeguard</h3><span>Safety & response</span></div>
                <p>Applied situational awareness, team communication, responsibility, and established emergency procedures in a safety-focused role.</p>
              </article>
              <div data-aos="zoom-in" className="other-employment">
                <p className="mono">ADDITIONAL EMPLOYMENT</p>
                <span>AutoZone <i>Sales Associate</i></span>
                <span>Big Lots <i>DTS</i></span>
              </div>
            </div>
          </div>
          <div data-aos="fade-up" className="project-aos-wrapper">
            <CredentialCard />
          </div>
        </section>

        <section data-aos="fade-down" className="about-section" id="about" aria-labelledby="about-title">
          <RefractiveSurface variant="about" className="about-inner">
            <div className="about-grid page-width">
              <div className="about-heading">
              <p className="eyebrow"><span className="mono">05</span> A little context</p>
              <h2 id="about-title">Curiosity at every layer.</h2>
              </div>
              <div className="about-copy">
              <p data-aos="zoom-in" className="about-lede">I&apos;ve been fascinated by programming since I was 12. What started as curiosity grew into a long-term interest in understanding how software works, from the interface someone interacts with to the systems executing underneath it.</p>
              <p data-aos="zoom-in">I enjoy building software that bridges those layers. Whether I&apos;m designing an interactive React interface, inspecting machine instructions, or experimenting with procedural generation, my goal is to make complex technology more understandable and useful.</p>
              <p data-aos="zoom-in">That means caring about the architecture behind a feature as much as the experience in front of it: keeping code modular, solving problems deliberately, and making tools that help people see what a system is doing.</p>
              <details data-aos="zoom-in" className="developer-notes">
                <summary><span className="mono">DEVELOPER NOTES</span><span aria-hidden="true">＋</span></summary>
                <div>
                  <p>This site uses Next.js App Router with server-rendered portfolio content. Small client components power the section-aware navigation, skill filters, and persistent accent picker.</p>
                  <p>The header and About slab use a lightweight SVG displacement backdrop where the browser supports it, bending live pixels behind the surface. Unsupported engines use native frost/blur instead. Floating interface fragments use compositor-driven transforms; the original OpenGlassUI WebGL2 demo loads on demand and renders at display refresh rate.</p>
                </div>
              </details>
              </div>
            </div>
          </RefractiveSurface>
        </section>

        <section className="contact-section page-width" id="contact" aria-labelledby="contact-title">
          <div className="contact-copy">
            <p data-aos="fade-down" className="eyebrow"><span className="mono">06</span> Contact</p>
            <h2 data-aos="fade-left" id="contact-title">Let&apos;s build something interesting.</h2>
            <p data-aos="fade-right">I&apos;m interested in opportunities involving frontend engineering, full-stack development, developer tooling, and ambitious software projects.</p>
          </div>
          <div className="contact-actions">
            <a data-aos="fade-left" className="button button-primary" href="https://github.com/RegionZeroProcedural" target="_blank" rel="noreferrer">Find me on GitHub <span aria-hidden="true">↗</span></a>
            <a data-aos="fade-right" className="button button-secondary" href="https://www.linkedin.com/in/keegan-labrot-547369417" target="_blank" rel="noreferrer">View my LinkedIn <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
      <footer data-aos="fade-up" className="site-footer page-width">
        <a className="footer-name" href="#home">KL<span>.</span></a>
        <p>Software developer · Creative technologist</p>
        <div className="footer-links">
          <a href="https://github.com/RegionZeroProcedural" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="https://regionzeroprocedural.github.io/" target="_blank" rel="noreferrer">Portfolio ↗</a>
        </div>
        <span className="footer-copyright mono">© KEEGAN LABROT</span>
        <ThemeControl />
      </footer>
      <ContactDock />
    </>
  );
}
