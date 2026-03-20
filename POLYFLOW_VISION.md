POLYFLOW Project Blueprint: High-Leverage Immersive Agency


1. 
System Context & IdentityFounder: George Constantin (CS Student, Bucharest).Entity: POLYFLOW — A boutique immersive web development studio.Mission: Transform traditional websites into premium, interactive 3D digital environments.

Target Market: Tech startups, real estate, premium brands (High-ticket: €3k – €20k+ per project).

Core Stack: Next.js, React Three Fiber (R3F), Three.js, GSAP (ScrollTrigger), Anime.js (UI), Supabase, Blender (GLTF/GLB), Tailwind CSS.

2. 
Visual Architecture: The "Kinetic Core"The website is a high-performance WebGL application where the navigation is a physical journey through space.

The Hero (Nexus)Visual: A central "Kinetic Core" consisting of thousands of individual polygon tiles (InstancedMesh).

Motion: A vertex-shader-driven noise field makes the core "breathe."Interaction: On scroll, specific tiles break away, morph into portals, and the camera flies through them into "Micro-Worlds."


3. The 5 Strategic Portals (Scroll Journey)PortalDestinationTechnical FeatureStrategic Message
01. The OriginWho We AreFloating 3D Typography (Text3D)"Visual Engineering" over "Web Design."
02. The ArchiveAccomplishmentsPortal-in-Portal (Render Targets)Technical mastery of complex WebGL.
03. The ForgeTechnical EdgeShader-based wireframe/code streamJustifying the premium price through tech.
04. The StrategyServices & ROI3D Infographics (Bar charts/Stats)400% engagement increase via 3D.
05. The NexusConversionGlass-morphism + 3D Budget SliderLead qualification (€3k - €15k+).

4. Technical Implementation RequirementsScene Management
State: Use Zustand to track active worlds and transition progress.
Optimization: Implement a Scene Manager that mounts/unmounts "Worlds" to keep the draw call count low.
Transitions: Use the "Tunnel Effect." 
While the camera is inside a portal/transition, trigger the asset load/mount for the next scene. Use Post-processing (Bloom/Vignette) to mask the swap.
Performance Standards Target: 60FPS on mid-range mobile devices.
Assets: All models must be GLB with Draco/KTX2 compression.
Lighting: Baked lighting from Blender; use low-res (1k) HDRIs for environmental reflections.Animation: * 
GSAP: Drives the camera CatmullRomCurve3 path and scroll-sync.
Anime.js: Orchestrates SVG logo drawing and DOM text reveals.
Lead Generation PipelineIntegration: Form data sent to Supabase via Edge Functions.
Qualification: Budget selector must anchor pricing between €3,000 and €15,000+.

5. Coding Principles for Claude Code 
Modular R3F: Keep 3D components (Core, Portals, Worlds) in a separate /components/canvas directory.
Clean Transitions: Use useFrame for smooth camera interpolation.
UI Overlay: Keep the HTML/CSS layer (/components/ui) strictly decoupled from the WebGL context.