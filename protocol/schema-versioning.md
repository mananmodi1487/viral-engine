# Schema versioning and migration policy

ODS is a public protocol. That means a change to it is a change to other people's infrastructure,
including people we will never meet. The rules below exist so that someone who implemented ODS 1.0
in 2026 can still read a 2029 document.

## Semantics

`MAJOR.MINOR.PATCH`

| Change | Bump | Example |
|---|---|---|
| Adding an optional field | MINOR | adding `accessibility.screen_reader_notes` |
| Adding a value to an open vocabulary (e.g. a new `artifact.type`) | MINOR | adding `"mastodon-thread"` |
| Adding a new required field | **MAJOR** | requiring `provenance` |
| Removing a field | **MAJOR** | removing `audience_analysis` |
| Tightening a constraint so previously-valid documents become invalid | **MAJOR** | `maxLength: 280` on `x_thread` items |
| Changing the meaning of a field | **MAJOR** | redefining `share_friction_score` as lower-is-better |
| Changing AQI weights | **MINOR for the spec, MAJOR for comparability** | see below |
| Documentation or description text only | PATCH | clarifying a `$comment` |

## The AQI comparability rule

AQI totals are only comparable within one `aqiVersion`. The weights file lives at
`protocol/aqi-weights.json` and is versioned separately from the schema, because a schema change
and a rubric change are different kinds of change and conflating them is how benchmarks become
unfalsifiable.

- Changing a weight or adding/removing a dimension bumps `aqiVersion` **minor** (e.g. `1.0.0` →
  `1.1.0`).
- Any published comparison ("attempts score higher after coaching") **must** state the
  `aqiVersion` and must not mix versions.
- Old scores are never retroactively reinterpreted. If you re-score under a new version, publish
  both numbers.

## Additive rule (the important one)

A consumer **must** ignore fields it does not recognise. A producer **must not** change the
meaning of an existing field. If a producer needs new semantics, it adds a new field.

```
1.0 document -> read by 1.1 consumer   OK
1.1 document -> read by 1.0 consumer   OK, unknown fields ignored
```

Breaking that rule is the single fastest way to kill a protocol: it turns every consumer into a
maintenance burden.

## Extensions

Third parties may add fields, but only under a namespaced prefix so collisions are impossible:

```json
{
  "x_acme_agency": {
    "client_id": "acme-114",
    "internal_review_state": "needs-legal"
  }
}
```

Rules:

1. A namespaced extension must not be required for the document to validate against ODS.
2. A namespaced extension must not change the meaning of any ODS field.
3. A namespaced extension must not contain personal data about third parties. The schema cannot
   enforce this; reviewers can, and `governance/anti-abuse.md` says they will.

## Migrations

`packages/protocol/src/migrate.ts` holds forward migrations. Each migration:

- takes a document of version N and returns version N+1
- is pure (no network, no clock, no randomness)
- has a test with a fixture of the old shape
- never deletes user data silently — unknown or removed fields move into `x_migrated_from_<version>`
  so nothing is lost on the way forward

```bash
# library
migrateDocument(oldDoc)   // -> current, or throws with a readable reason

# CLI
viral-engine migrate report.json --to 1.0.0 -o report.migrated.json
```

Migrations are never destructive and never "best effort". A migration that cannot preserve a field
throws rather than quietly dropping it.

## Sunset policy

If ODS is ever superseded by a better protocol:

1. The old schema stays published and hosted forever. Documentation does not rot into 404s.
2. A migration tool ships with the announcement, not after it.
3. The announcement includes why the new protocol is better and what breaks.
4. Nothing is deleted from `evidence/`. Historic labels remain readable under historic schemas.

A protocol that deletes its own history is a marketing site, not a standard.
