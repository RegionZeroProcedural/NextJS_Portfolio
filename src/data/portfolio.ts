export interface Project {
  name: string;
  category: string;
  description: string;
  challenge: string;
  approach: string;
  technologies: string[];
  visual: "flow" | "byteframe" | "substrata" | "glass" | "chirpr" | "marketplace";
  links?: { label: string; href: string }[];
}

export interface Experiment {
  name: string;
  category: string;
  description: string;
  technologies: string[];
  glyph: string;
}

export const featuredProjects: Project[] = [
  {
    name: "Nexa Flow",
    category: "Developer tools / Visual programming / Program analysis",
    description: "A visual programming, simulation, and debugging application that represents program logic as connected nodes. It explores how making execution and variable state visible can make complex behavior easier to inspect.",
    challenge: "A node editor is only useful when it communicates what a program is doing, not just what its graph looks like.",
    approach: "Combines variable, operator, function, and conditional nodes with execution simulation, variable-state inspection, execution tracking, and code import/export capabilities. A modular React component architecture supports the interactive workspace.",
    technologies: ["React", "JavaScript", "Program analysis", "Interactive visualization"],
    visual: "flow",
    links: [{ label: "Open live demo", href: "https://nexa-flow-olive.vercel.app/" }],
  },
  {
    name: "ByteFrame + Nexa Docs",
    category: "Developer tools / Binary analysis / Document engineering",
    description: "A binary inspection and editing tool integrated with the Nexa Docs document editing ecosystem. It connects low-level binary data with an interface designed to make instruction behavior more approachable.",
    challenge: "Binary and instruction-level details can be difficult to navigate without useful context or explanations.",
    approach: "Supports hexadecimal inspection and editing, x86-64 instruction decoding, human-readable assembly explanations, contextual operation notes, multiple levels of explanation, and exporting modified binary data.",
    technologies: ["React", "JavaScript", "Binary processing", "Instruction decoding"],
    visual: "byteframe",
  },
  {
    name: "Substrata",
    category: "Game development / Graphics programming / Procedural generation",
    description: "A Unity cave exploration and procedural-generation project focused on creating and rendering complex underground environments. It is an engineering and gameplay experiment, not a commercially released game.",
    challenge: "Generating detailed underground spaces requires balancing spatial structures, visual quality, and the cost of dynamic terrain.",
    approach: "Explores signed distance fields, octree-based spatial structures, GPU compute shader assistance, Unity HDRP, DirectX Raytracing, resource distribution, and environmental simulation alongside mining, ropes, and exploration mechanics.",
    technologies: ["Unity", "C#", "HLSL", "Compute shaders", "Procedural generation"],
    visual: "substrata",
  },
  {
    name: "OpenGlassUI",
    category: "UI engineering / Graphics / Open source",
    description: "An experimental open-source glassmorphism rendering library exploring customizable glass-like materials beyond conventional CSS effects.",
    challenge: "A convincing glass interface depends on more than transparency: surface shape, highlights, distortion, and subtle imperfections all affect how a material reads.",
    approach: "Experiments with refraction-inspired rendering, surface curvature, glass highlights, chromatic aberration, frosted effects, customizable optical parameters, height and normal maps, and interactive rendering.",
    technologies: ["React", "JavaScript", "Graphics programming", "Interactive rendering"],
    visual: "glass",
  },
  {
    name: "Chirpr Social",
    category: "Frontend engineering / Social applications",
    description: "An interactive React social platform built to explore social-feed interactions, media-focused layouts, and customizable profile experiences.",
    challenge: "Social interfaces need to make frequent interactions feel coherent without making the feed visually noisy.",
    approach: "Includes an interactive feed, animated navigation, profile themes, reactions, post creation and deletion, responsive layouts, and scroll-driven animation.",
    technologies: ["React", "JavaScript", "CSS", "Frontend state management"],
    visual: "chirpr",
    links: [{ label: "Open live demo", href: "https://chirprsocial.vercel.app/" }],
  },
  {
    name: "NFT Marketplace",
    category: "Frontend engineering / API integration / Training project",
    description: "A React marketplace development project completed through Frontend Simplified, focused on making an existing application dynamic.",
    challenge: "Turning a static marketplace interface into a responsive application that reflects fetched data and supports useful browsing behavior.",
    approach: "Implemented external API data fetching, loading skeletons, interactive components, countdown timers, dynamic routing, collection carousels, filtering, pagination, load-more behavior, and Git-based feature workflows.",
    technologies: ["React", "JavaScript", "Axios", "REST APIs", "Git", "CSS"],
    visual: "marketplace",
  },
];

export const otherProjects: Experiment[] = [
  {
    name: "OfferGrid",
    category: "Product intelligence",
    description: "An application concept exploring price tracking, product comparison, and purchasing insights.",
    technologies: ["Product research", "Application design"],
    glyph: "⌗",
  },
  {
    name: "Android USB Networking Relay",
    category: "Networking experiment",
    description: "A custom networking experiment relaying traffic between Android and Windows using Android Debug Bridge and a SOCKS5 proxy.",
    technologies: ["Android Debug Bridge", "Python", "SOCKS5"],
    glyph: "⇄",
  },
  {
    name: "Speak.Vote",
    category: "Civic technology prototype",
    description: "A prototype exploring civic participation, proposed legislation, structured discussion, and transparent voting systems.",
    technologies: ["Civic technology", "Application prototype"],
    glyph: "◎",
  },
  {
    name: "Gopher",
    category: "Source analysis experiment",
    description: "An experimental source-code security analysis tool focused on scanning publicly accessible JavaScript and TypeScript resources.",
    technologies: ["JavaScript", "TypeScript", "Source analysis"],
    glyph: "⌕",
  },
];

export const skillGroups = [
  {
    name: "Frontend",
    label: "Frontend engineering",
    description: "Interfaces built for clarity, accessibility, and responsive behavior.",
    skills: ["React", "Next.js", "JavaScript", "TypeScript", "HTML", "CSS", "SCSS", "Responsive UI", "Accessibility"],
  },
  {
    name: "Backend",
    label: "Backend & APIs",
    description: "Application services, integrations, and data-backed experiences.",
    skills: ["Node.js", "Express", "REST APIs", "MongoDB", "Python"],
  },
  {
    name: "Systems",
    label: "Systems & programming",
    description: "Exploring program behavior from source and binary data to execution.",
    skills: ["C", "C++", "Rust", "C#", "Java", "Binary processing", "Debugging", "Program analysis"],
  },
  {
    name: "Graphics",
    label: "Graphics & game development",
    description: "Procedural environments and experiments in rendering and GPU work.",
    skills: ["Unity", "HDRP", "Compute shaders", "Procedural generation", "Signed distance fields", "GPU programming", "HLSL"],
  },
  {
    name: "Tooling",
    label: "Development tools",
    description: "The everyday tools and workflows used to build and ship software.",
    skills: ["Git", "GitHub", "npm", "Vercel", "Testing", "Debugging", "Build tooling"],
  },
] as const;
