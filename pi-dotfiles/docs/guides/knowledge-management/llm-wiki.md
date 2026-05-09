# LLM Wiki Pattern

A pattern for building **personal knowledge bases using LLMs**.

> This is an idea file designed to be copy-pasted to your own LLM Agent (e.g., OpenAI Codex, Claude Code, OpenCode/Pi, etc.). Its goal is to communicate the high-level idea; your agent will build out the specifics in collaboration with you.

---

## The Core Idea

Most people's experience with LLMs and documents looks like RAG: you upload a collection of files, the LLM retrieves relevant chunks at query time, and generates an answer. This works, but the LLM is rediscovering knowledge from scratch on every question. There's no accumulation.

**The insight:** Instead of just retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files that sits between you and the raw sources.

When you add a new source, the LLM doesn't just index it for later retrieval. It:
- Reads it
- Extracts key information
- Integrates it into the existing wiki
- Updates entity pages
- Revises topic summaries
- Notes contradictions between new and old claims
- Strengthens or challenges the evolving synthesis

**The knowledge is compiled once and then kept current**, not re-derived on every query.

---

## The Key Difference

The wiki is a **persistent, compounding artifact**:

| RAG Approach | LLM Wiki Pattern |
|-------------|------------------|
| Retrieve → Generate (every time) | Ingest → Update → Query compiled knowledge |
| Cross-references discovered per-query | Cross-references already maintained |
| Contradictions found ad-hoc | Contradictions already flagged |
| Synthesis re-derived each time | Synthesis reflects everything you've read |

---

## Use Cases

- **Personal**: Track goals, health, psychology, self-improvement — filing journal entries, articles, podcast notes, building a structured picture of yourself over time
- **Research**: Deep dives over weeks/months — reading papers, reports, incrementally building a comprehensive wiki with evolving thesis
- **Reading**: File each chapter as you go, build pages for characters, themes, plot threads. Think fan wikis like [Tolkien Gateway](https://toltiengateway.net/wiki/Main_Page) — thousands of interlinked pages built by volunteers over years
- **Business/Team**: Internal wiki maintained by LLMs, fed by Slack threads, meeting transcripts, project documents, customer calls
- **Competitive analysis, due diligence, trip planning, course notes, hobby deep-dives**

---

## Architecture: Three Layers

```
┌─────────────────────────────────────────┐
│           SCHEMA (AGENTS.md)            │
│    Configuration for LLM wiki-keeping   │
├─────────────────────────────────────────┤
│                THE WIKI                 │
│    LLM-generated markdown files         │
│    (summaries, entities, concepts)      │
├─────────────────────────────────────────┤
│             RAW SOURCES                 │
│    Immutable source documents           │
│    (articles, papers, images, data)     │
└─────────────────────────────────────────┘
```

### Raw Sources
Your curated collection of source documents. Articles, papers, images, data files. **Immutable** — the LLM reads from them but never modifies them. This is your source of truth.

### The Wiki
A directory of LLM-generated markdown files. Summaries, entity pages, concept pages, comparisons, an overview, a synthesis. **The LLM owns this layer entirely.** It creates pages, updates them when new sources arrive, maintains cross-references, and keeps everything consistent.

> You read it; the LLM writes it.

### The Schema
A document (e.g., `CLAUDE.md` for Claude Code or `AGENTS.md` for Codex) that tells the LLM how the wiki is structured, what the conventions are, and what workflows to follow when ingesting sources, answering questions, or maintaining the wiki.

**This is the key configuration file** — it's what makes the LLM a disciplined wiki maintainer rather than a generic chatbot. You and the LLM co-evolve this over time.

---

## Operations

### Ingest
You drop a new source into the raw collection and tell the LLM to process it.

**Typical flow:**
1. LLM reads the source
2. Discusses key takeaways with you
3. Writes a summary page in the wiki
4. Updates the index
5. Updates relevant entity and concept pages across the wiki
6. Appends an entry to the log

A single source might touch 10-15 wiki pages.

> **Tip:** Ingest one at a time and stay involved — read summaries, check updates, guide emphasis. Or batch-ingest with less supervision. Document your workflow in the schema.

### Query
You ask questions against the wiki. The LLM searches for relevant pages, reads them, and synthesizes an answer with citations.

**Key insight:** Good answers can be filed back into the wiki as new pages. Comparisons, analyses, connections — these shouldn't disappear into chat history. Your explorations compound in the knowledge base.

### Lint
Periodically, ask the LLM to health-check the wiki:

- [ ] Contradictions between pages
- [ ] Stale claims superseded by newer sources
- [ ] Orphan pages with no inbound links
- [ ] Important concepts lacking their own page
- [ ] Missing cross-references
- [ ] Data gaps that could be filled with web search

---

## Indexing and Logging

Two special files navigate the wiki as it grows:

### `index.md`
**Content-oriented catalog** — each page listed with link, one-line summary, metadata (date, source count). Organized by category (entities, concepts, sources). LLM updates on every ingest. The LLM reads the index first when answering queries.

> Works surprisingly well at moderate scale (~100 sources, ~hundreds of pages) without embedding-based RAG.

### `log.md`
**Chronological append-only record** — ingests, queries, lint passes. Use consistent prefixes for parseability:

```markdown
## [2026-04-02] ingest | Article Title
## [2026-04-03] query | Competitive landscape analysis
## [2026-04-05] lint | Contradiction check
```

```bash
# Get last 5 entries
grep "^## \[" log.md | tail -5
```

---

## Optional: CLI Tools

At scale, build tools to help the LLM operate more efficiently:

**Search:** [qmd](https://github.com/tobi/qmd) — local search engine for markdown with hybrid BM25/vector search and LLM re-ranking. Has CLI and MCP server.

**Or vibe-code** a simple search script as needed.

---

## Recommended Tools

| Tool | Purpose |
|------|---------|
| **Obsidian** | IDE for the wiki. LLM is programmer; wiki is codebase. |
| **Obsidian Web Clipper** | Browser extension → markdown for raw sources |
| **Obsidian Graph View** | See wiki shape — connections, hubs, orphans |
| **Marp** | Markdown-based slide decks from wiki content |
| **Dataview** | Query YAML frontmatter for dynamic tables |

### Image Handling
In Obsidian Settings → Files and links, set "Attachment folder path" to `raw/assets/`. Bind "Download attachments for current file" to a hotkey (e.g., Ctrl+Shift+D) to download images locally after clipping.

> LLMs can't natively read markdown with inline images in one pass. Workaround: read text first, then view referenced images separately.

---

## Why This Works

The tedious part of maintaining a knowledge base is not the reading or thinking — it's the bookkeeping:

- Updating cross-references
- Keeping summaries current
- Noting when new data contradicts old claims
- Maintaining consistency across dozens of pages

**Humans abandon wikis** because maintenance burden grows faster than value.

**LLMs don't get bored**, don't forget cross-references, and can touch 15 files in one pass. The wiki stays maintained because the cost of maintenance is near zero.

---

## Historical Echo

The idea is related to **Vannevar Bush's Memex (1945)** — a personal, curated knowledge store with associative trails between documents. Bush's vision was closer to this than to what the web became: private, actively curated, with the connections between documents as valuable as the documents themselves.

The part he couldn't solve was who does the maintenance. **The LLM handles that.**

---

## Note

This document is intentionally abstract. It describes the idea, not a specific implementation. The exact directory structure, schema conventions, page formats, tooling — all depends on your domain, preferences, and LLM of choice.

**Everything mentioned is optional and modular** — pick what's useful, ignore what isn't.

The right way to use this is to share it with your LLM agent and work together to instantiate a version that fits your needs. The document's only job is to communicate the pattern. Your LLM can figure out the rest.