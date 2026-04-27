# Part 1 — Vision and Requirements

## Product Vision

The editor enables users to build Boukamp circuits visually and textually, keeping the SVG canvas and DSL representation in sync. It should serve both scientific application integrations and embeds in analysis tools, dashboards, and virtual labs.

## Business Goals

- Reduce time spent building and correcting circuits.
- Minimize syntax errors when manually editing the DSL.
- Facilitate integration across different frontend stacks.
- Offer a consistent experience with no framework lock-in.

## Technical Goals

- Keep the `core` 100% framework-agnostic.
- Use no external rendering, state, drag-and-drop, or diagramming libraries.
- Support import and export of the Boukamp DSL.
- Allow future extensibility for new elements and validation rules.

## User Types

- Researcher building equivalent circuits for EIS.
- Developer integrating the editor into a SPA or scientific portal.
- End user who prefers visual editing and only reviews the DSL.
- QA team needing reproducible, exportable scenarios.

## Primary Use Cases

- Create a circuit from scratch by dragging elements onto the canvas.
- Edit an existing circuit by importing a Boukamp string.
- Modify series/parallel connections through visual actions.
- See semantic errors or warnings in real time.
- Export as DSL, SVG, or JSON configuration.

## Functional Requirements

- Create, select, move, duplicate, and delete nodes and branches.
- Insert elements `R`, `C`, `L`, `Q`, `W`, `Ws`, `Wo`.
- Convert structures between series and parallel with guided actions.
- Sync DSL text <-> AST <-> visual scene.
- Undo and redo operations.
- Zoom, pan, fit to content, and center.
- Expose events for host integrations.

## Non-Functional Requirements

- Fast startup and small bundle size.
- Stable, well-documented public API.
- Consistent rendering across modern browsers.
- Smooth interactions with small and medium circuits.
- Basic keyboard accessibility and SVG-compatible screen readers.

## Constraints

- No external dependencies.
- All visual output uses SVG.
- The existing parser lives in a separate module and must be consumed as an external capability or internal adapter.
- The product must be useful even in `Vanilla JS` without a complex build.

## Definition of Success

- A user can build a reference circuit without writing any DSL.
- The generated DSL is canonical and valid.
- The editor can be mounted in any supported framework with a homogeneous API.
- Initial integration time in a new host is low.