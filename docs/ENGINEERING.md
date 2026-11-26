# E-Gudang — Engineering standards

## Decisions

- Specification first: read PRD, DESIGN and PROJECT_STRUCTURE before implementation. Change the specification explicitly if scope changes.
- Keep the simplest correct, readable implementation. Reuse existing libraries, tokens and components. Avoid duplication of business rules, premature abstraction, extra dependencies and unnecessary state.
- Use Server Components by default; client boundaries only for interaction or browser APIs. Keep database, validation and authorization on the server.
- Maintain strict TypeScript. Avoid unsafe casts and `any`; use explicit submit actions and validate data at trust boundaries.
- Optimize only with evidence: measure production bundle, network/DB requests, rendering and Core Web Vitals before adding memoization, caching or new infrastructure.
- Preserve the approved visual design, keyboard behavior and responsive layout when refactoring. Fewer lines alone do not demonstrate quality.

## Quality gate

Development baseline: Node 26.7.0 and npm 12.0.2, matching the established local toolchain. Keep the lockfile committed. No new runtime or test dependency is required.

```powershell
npm ci
npm run check
```

The check runs route type generation + TypeScript, ESLint with zero warnings, Node's built-in test runner, then production build. Use `npm run typecheck`, `npm run lint`, `npm test` or `npm run build` separately for diagnosis.

GitHub Actions runs the same gate for PRs to main and main pushes. Actions are pinned by commit, checkout credentials are not persisted, and permissions are read-only. It must not use production database credentials. When database integration tests are added, provision an isolated test database.

Unit tests belong with the relevant feature branch. Test runner setup alone is not coverage; the design/layout branches add their own regression tests. Node 26 executes erasable TypeScript directly in tests; the compiler check is still required.

## Review before merge

- [ ] Meets PRD and design requirements; scope limited to the feature branch.
- [ ] Quality gate passes on the candidate commit; relevant tests cover behavior and regressions.
- [ ] Review dependency changes and lockfile; run `npm audit` and evaluate advisories rather than using blind force fixes.
- [ ] Browser QA: both themes, 320px/768px/desktop, keyboard, focus, reduced motion, relevant contrast and interactions.
- [ ] Performance: record production baseline before claiming an optimization. Investigate regressions rather than adding speculative memoization.
- [ ] No secrets, generated client or real warehouse data in Git.
- [ ] Human review before merge; CI success is not a substitute for authorization, inventory correctness or usability testing.

Branch responsibility: `feat/global-design-system` for design tokens/primitives; `feat/global-app-layout` for shell; `chore/code-quality` for shared quality tooling. Merge tooling and approved design changes before integrating layout, then rerun checks on the integrated commit.
