---
name: laymans-terms
description: Re-explain the most recent technical explanation in plain language for a smart non-specialist — lead with the consequence, name the real thing, keep the recommendation. Invoke as /laymans-terms (last explanation) or /laymans-terms <topic> (something earlier in the session).
---

# Layman's terms — translate, don't re-litigate

Take the most recent technical explanation in this conversation (or the topic
the user named) and re-explain it for a smart reader who doesn't have the
domain. This is a re-registering, not a summary: same content, same
conclusions, different vocabulary.

## Rules

1. **Lead with the consequence, then the mechanism.** The reader wants to know
   whether it matters before they want to know how it works. "Customers see an
   error page for a minute or two" comes before any explanation of why.
2. **Name the real thing.** Don't substitute an analogy for the subject —
   "the database and the code disagree about which columns exist" beats "think
   of it like a library catalog." Analogies drift, and the reader ends up
   reasoning about the analogy instead of the system.
3. **Keep the nouns the reader owns; drop the ones they don't.** Their service
   names, file names, and product terms stay. Vocabulary that only exists
   inside the implementation (`ProgrammingError`, `max_tokens`, `beat`) goes,
   replaced by what it means.
4. **Restate the recommendation in the same direction.** If the original
   explanation ended in a call, the translation ends in the same call. This
   skill never re-derives or reverses a decision.
5. **Don't soften real risk.** If the honest version is "this can show
   customers an error page," that sentence survives translation. Smooth
   reading never outranks accuracy.
6. **2–5 sentences per concept.** Not a lecture, not a glossary. Assume a
   smart reader — dumbing down is a failure mode, jargon is the other one.

## Worked examples

**Before:** "Only the web service runs migrate; worker/beat redeploy from the
same commit with no ordering guarantee, so old code SELECTs a dropped column
and raises ProgrammingError."

**After:** "The migration deletes a database column. The website and the
background workers restart independently, so for a minute or two they disagree
about whether that column exists. Old code asking for a column that's gone
shows an error page; the reverse crashes a background job. Both fix themselves
within minutes — the first one is the one customers could see."

**Before:** "max_tokens caps thinking and output together, so on a model with
adaptive thinking on by default, an omitted thinking param can truncate the
forced tool_use block, surfacing as a null QA verdict rather than an error."

**After:** "'Thinking' is scratch work the model does before answering, and
there's one budget covering scratch work and the answer together. Our quality
checker has to reply in a structured format — if scratch work eats the budget,
that reply gets cut off, and our code reads the silence as 'nothing to report'
instead of 'this broke.' A quality check that fails quietly."

**Before:** "The queue is field-scoped but approvals fan out per-store, so a
single bulk approve enqueues N sync jobs that hit the vendor API concurrently
and trip its rate limiter, leaving some stores updated and some not."

**After:** "One click on 'approve all' quietly becomes many separate update
requests — one per store — all sent at once. The vendor starts rejecting
requests when too many arrive together, so some stores get the update and
some don't, with no error shown. The stores silently drift out of sync."
