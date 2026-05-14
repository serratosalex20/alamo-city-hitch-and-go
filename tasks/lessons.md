# Lessons Learned

Per `CLAUDE.md` Learning Rules: after any correction, append a lesson here. Review at the start of every session.

---

## Format

Each entry:
- **Date:** YYYY-MM-DD
- **Context:** what I was doing
- **Mistake:** what went wrong
- **Correction:** what the user said / what fixed it
- **Rule:** the durable takeaway

---

## Entries

### 2026-04-12 — UI/UX Audit Findings
- **Context:** Building initial components (Navbar, forms, dashboard)
- **Mistake:** Shipped without a11y fundamentals — no skip-link, no focus-visible, no htmlFor/id on form labels, no aria-hidden on decorative icons, no prefers-reduced-motion, download buttons at 32x32 (below 44px touch minimum), no mobile nav, progress bar missing role="progressbar"
- **Correction:** Full 10-category audit caught all issues
- **Rule:** Before marking any page "done", run through: (1) skip-link present, (2) all icons aria-hidden, (3) form labels have htmlFor+id, (4) all buttons/links min 44x44, (5) prefers-reduced-motion in globals.css, (6) focus-visible styles, (7) heading hierarchy h1→h2→h3, (8) aria-current on active nav, (9) role="progressbar" on progress bars, (10) sizes attr on all fill images

### 2026-05-14 — Lost Work in a Worktree
- **Context:** Built three deliverable files (`brand-guide.html`, `rental-agreement.html`, `deliverables/README.md`) plus a substantially revised `tasks/todo.md` inside the worktree at `.claude/worktrees/bold-moore-a6a914/`. Verified them visually in Chrome DevTools. Asked the user "want me to commit?" and stopped working until they replied.
- **Mistake:** Treated commits as a final step instead of an incremental one. When the session ended and the worktree was cleaned up between sessions, the working-tree files were destroyed. `git reflog` confirmed the branch `claude/bold-moore-a6a914` never advanced past its creation point. No stash. No dangling objects. All output gone.
- **Correction:** The user lost roughly an hour of brand work and had to ask for a rebuild. Took ownership and rebuilt with the new rule below.
- **Rule:** **Commit-on-write inside a worktree, never commit-at-the-end.** As soon as a meaningful artifact is written to disk in a worktree, immediately `git add <file> && git commit -m "..."` on the worktree's branch. Worktree directories are removable scratch space — any uncommitted change there is one-way disposable. The rule is *not* "ask for permission to commit first"; the rule is "commit, then ask for permission to *push* or *merge*." Commits are local — they cost nothing and they make work durable.
