import type { Project } from "@/data/portfolio";
import { GlassProjectCard } from "@/components/GlassProjectCard";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  if (project.visual === "glass") return <GlassProjectCard project={project} index={index} />;
  return (
    <article className={`project-card glass-panel project-${project.visual}`}>
      <div className="project-preview" aria-hidden="true">
        <span className="preview-index mono">PROJECT / 0{index + 1}</span>
        {project.visual === "flow" && (
          <div className="preview-flow">
            <span className="flow-node">INPUT</span><i /><span className="flow-node flow-active">PROCESS</span><i /><span className="flow-node">OUTPUT</span>
            <span className="flow-branch">IF / ELSE</span>
          </div>
        )}
        {project.visual === "byteframe" && (
          <div className="hex-preview mono">
            <span>00000010</span><span>48 8B 05 3C 2A 00 00</span><span className="hex-highlight">MOV&nbsp; RAX, [RIP + 0x2A3C]</span>
            <span>00000017</span><span>48 85 C0&nbsp; 74 08</span><span>TEST RAX, RAX</span>
          </div>
        )}
        {project.visual === "substrata" && <div className="cave-preview"><span /><i /><b /></div>}
        {project.visual === "chirpr" && (
          <div className="social-preview">
            <div><i /> <span><b /> <b /></span></div><p /><p /><div className="social-reactions">♡ &nbsp; ◌ &nbsp; ↗</div>
          </div>
        )}
        {project.visual === "marketplace" && (
          <div className="market-preview">
            <span className="market-item market-one">✳</span><span className="market-item market-two">◈</span><span className="market-item market-three">⬡</span>
            <div className="market-caption"><i /><i /><i /></div>
          </div>
        )}
        <span className="preview-corner" />
      </div>
      <div className="project-content">
        <p className="project-category mono">{project.category}</p>
        <h3>{project.name}</h3>
        <p className="project-description">{project.description}</p>
        <ul className="tag-list" aria-label={`${project.name} technologies`}>
          {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
        <details className="project-details">
          <summary><span>Engineering notes</span><span aria-hidden="true">＋</span></summary>
          <div className="project-detail-copy">
            <p><strong>Problem space</strong>{project.challenge}</p>
            <p><strong>Implementation</strong>{project.approach}</p>
          </div>
        </details>
        {project.links && (
          <div className="project-links">
            {project.links.map((link) => (
              <a href={link.href} key={link.href} rel="noreferrer" target="_blank">{link.label} <span aria-hidden="true">↗</span></a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
