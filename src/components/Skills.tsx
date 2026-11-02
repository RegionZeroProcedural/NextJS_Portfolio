"use client";

import { useState } from "react";
import { skillGroups } from "@/data/portfolio";

export function Skills() {
  const [selected, setSelected] = useState<(typeof skillGroups)[number]["name"]>("Frontend");
  const current = skillGroups.find((group) => group.name === selected) ?? skillGroups[0];

  return (
    <div className="skills-panel glass-panel">
      <div className="skill-tabs" role="tablist" aria-label="Engineering disciplines">
        {skillGroups.map((group) => (
          <button
            aria-controls="skill-panel"
            aria-selected={selected === group.name}
            className={selected === group.name ? "skill-tab selected" : "skill-tab"}
            id={`tab-${group.name.toLowerCase()}`}
            key={group.name}
            onClick={() => setSelected(group.name)}
            tabIndex={selected === group.name ? 0 : -1}
            onKeyDown={(event) => {
              const currentIndex = skillGroups.findIndex(
                (item) => `tab-${item.name.toLowerCase()}` === event.currentTarget.id,
              );
              let nextIndex = currentIndex;

              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                nextIndex = (currentIndex + 1) % skillGroups.length;
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                nextIndex = (currentIndex - 1 + skillGroups.length) % skillGroups.length;
              } else if (event.key === "Home") {
                nextIndex = 0;
              } else if (event.key === "End") {
                nextIndex = skillGroups.length - 1;
              } else {
                return;
              }

              event.preventDefault();
              const nextTab = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
              nextTab?.focus();
              setSelected(skillGroups[nextIndex].name);
            }}
            role="tab"
            type="button"
          >
            <span className="tab-index mono">0{skillGroups.indexOf(group) + 1}</span>
            {group.label}
            <span className="tab-arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`tab-${selected.toLowerCase()}`}
        className="skill-content"
        id="skill-panel"
        role="tabpanel"
        tabIndex={0}
      >
        <p className="mono skill-current-label">ENGINEERING DISCIPLINE / {current.name.toUpperCase()}</p>
        <h3>{current.label}</h3>
        <p className="skill-description">{current.description}</p>
        <ul className="skill-tags">
          {current.skills.map((skill) => <li key={skill}>{skill}</li>)}
        </ul>
      </div>
    </div>
  );
}
