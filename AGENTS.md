📝 Description

A Bootstrap 5 web application for editing NOIZ Cadence avatars using Live2D models instead of GLB.
It mimics the existing 3D Cadence layout (like Fortnite/Roblox avatar editors) but swaps the 3D viewer for a Live2D preview panel.

🎯 Objectives

Implement a responsive Bootstrap 5 interface based on the current 3D Cadence design:

Left: category toolbar

Middle: item grid (thumbnails)

Right: live avatar preview

Integrate Live2D Cubism Web SDK to load .model3.json files and render them in the avatar preview window.

Treat each Live2D model as modular parts (body, hair, outfit, accessories) that can be swapped dynamically.

Selecting an item replaces the currently equipped part in real time.

Include Save & Close and Discard Changes buttons in the top-right corner.

All layout and styling must use Bootstrap 5 utility classes (no Tailwind, no custom CSS frameworks).

⚙️ Tech Stack

Bootstrap 5

Vanilla JavaScript

Live2D Cubism Web SDK

localStorage (temporary save state while editing)

🖥️ UI Layout

Sidebar: Vertical icon toolbar (Bootstrap nav-pills)

Content Left: Responsive grid list of parts (Bootstrap card components)

Content Right: Live2D model preview canvas

Header: Section title + Save/Discard buttons (Bootstrap btn-group)