"""Pydantic models for the Open Diffusion Spec 1.0.

Why this exists: a protocol with one implementation is a product. This is the
Python implementation, and it reads the *same* weights file as the TypeScript one
so the two cannot quietly disagree about what a dimension is worth.

Design rules inherited from the spec:
  * `unavailable` is a first-class basis. There is no code path that guesses.
  * a score cannot be constructed without evidence, an improvement, and a
    failure condition -- the validators raise.
  * nothing here calls the network, and nothing here reads a clock you did not
    give it.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Evidence basis and labels
# ---------------------------------------------------------------------------


class Basis(str, Enum):
    """How a value was produced. `unavailable` must be used instead of guessing."""

    MEASURED = "measured"
    STRUCTURAL = "structural"
    HEURISTIC = "heuristic"
    USER_SUPPLIED = "user-supplied"
    UNAVAILABLE = "unavailable"


class EvidenceLabel(str, Enum):
    SELF_REPORTED = "self-reported"
    VERIFIED = "verified"
    REPRODUCIBLE = "reproducible"
    ANECDOTAL = "anecdotal"
    UNCLEAR = "unclear"
    CONTESTED = "contested"
    PRIVATE_REDACTED = "private-redacted"


class Confidence(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Saturation(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    BLOCKER = "blocker"
    WARNING = "warning"
    NOTE = "note"


# ---------------------------------------------------------------------------
# AQI weights -- loaded from the shared file, never hardcoded
# ---------------------------------------------------------------------------

def _find_weights() -> Path:
    """Locate the shared weights file, wherever this package is installed.

    Order: explicit env var, then walk up from this file looking for
    protocol/aqi-weights.json. A protocol implementation that hardcodes weights
    is not an implementation of the protocol, it is a fork with extra steps.
    """
    import os

    env = os.environ.get("VIRAL_ENGINE_WEIGHTS")
    if env:
        return Path(env)
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "protocol" / "aqi-weights.json"
        if candidate.exists():
            return candidate
        candidate = parent / "aqi-weights.json"
        if candidate.name == "aqi-weights.json" and candidate.exists():
            return candidate
    raise FileNotFoundError(
        "Could not find protocol/aqi-weights.json. Set VIRAL_ENGINE_WEIGHTS to its path."
    )


WEIGHTS_PATH = _find_weights()


@dataclass(frozen=True)
class DimensionSpec:
    key: str
    label: str
    weight: int
    question: str


def load_weights(path: Optional[Path] = None) -> Dict[str, Any]:
    p = path or WEIGHTS_PATH
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def dimension_specs(path: Optional[Path] = None) -> List[DimensionSpec]:
    data = load_weights(path)
    return [
        DimensionSpec(key=d["key"], label=d["label"], weight=d["weight"], question=d["question"])
        for d in data["dimensions"]
    ]


def aqi_max(path: Optional[Path] = None) -> int:
    return int(load_weights(path)["max"])


def assert_weights_sum_to_max(path: Optional[Path] = None) -> int:
    specs = dimension_specs(path)
    total = sum(s.weight for s in specs)
    maximum = aqi_max(path)
    if total != maximum:
        raise ValueError(f"AQI weights sum to {total}, expected {maximum}")
    return total


# ---------------------------------------------------------------------------
# Core models
# ---------------------------------------------------------------------------


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class Artifact(_Model):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    type: str = Field(min_length=1)
    url: Optional[str] = None
    language: Optional[str] = None
    license: Optional[str] = None
    created_by: Optional[str] = None
    summary: Optional[str] = Field(default=None, max_length=2000)


class ProvenanceInput(_Model):
    kind: str
    ref: str
    fetched_at: Optional[datetime] = None
    degraded_reason: Optional[str] = None
    consent: Literal["public-artifact", "user-provided", "user-is-author", "unknown"] = "unknown"


class Provenance(_Model):
    inputs: List[ProvenanceInput] = Field(default_factory=list)
    ocr_or_transcription_used: bool = False
    network_calls: int = Field(default=0, ge=0)


class CurrentPositioning(_Model):
    one_sentence_description: str = Field(min_length=1)
    claimed_category: str = Field(min_length=1)
    actual_category_signals: List[str] = Field(default_factory=list)
    target_audience: List[str] = Field(default_factory=list)
    core_promise: Optional[str] = None
    core_tension: Optional[str] = None
    emotional_stake: Optional[str] = None
    basis: Basis = Basis.HEURISTIC


class AdjacentCategory(_Model):
    name: str
    why_less_crowded: str
    credibility_risk: Optional[str] = None
    tension_score: Optional[float] = Field(default=None, ge=0, le=5)
    proof_needed: Optional[str] = None


class FailureCondition(_Model):
    statement: str = Field(min_length=1)
    observable: str = Field(min_length=1)
    horizon: str = Field(min_length=1)


class CategoryAnalysis(_Model):
    saturation_estimate: Saturation
    saturation_basis: Basis = Basis.UNAVAILABLE
    competitors: List[str] = Field(default_factory=list)
    adjacent_categories: List[AdjacentCategory] = Field(default_factory=list)
    recommended_category: str = Field(min_length=1)
    category_confidence: float = Field(ge=0, le=1)
    evidence: List[str] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    proposed_positioning: Optional[str] = None
    proof_required: Optional[str] = None
    failure_condition: Optional[FailureCondition] = None

    @model_validator(mode="after")
    def unknown_needs_a_reason(self) -> "CategoryAnalysis":
        if self.saturation_estimate == Saturation.UNKNOWN and not self.missing_data:
            raise ValueError(
                "saturation_estimate 'unknown' must state what is missing, in missing_data"
            )
        return self


class AudienceAnalysis(_Model):
    specificity: Literal["named-individual", "named-role", "segment", "demographic", "everyone"]
    named_people: List[str] = Field(default_factory=list)
    where_they_gather: List[str] = Field(default_factory=list)
    what_they_already_believe: List[str] = Field(default_factory=list)
    what_they_would_lose_by_sharing: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)


class BroadcasterCandidate(_Model):
    candidate: str
    where_to_find: str
    why_they_might_care: Optional[str] = None
    what_makes_them_look_good: Optional[str] = None
    consent_status: Literal["not-contacted", "opted-in", "declined", "unknown"] = "unknown"
    contact_channel: Optional[str] = None


class BroadcasterAnalysis(_Model):
    primary_broadcaster_type: str
    specific_broadcaster_candidates: List[BroadcasterCandidate] = Field(default_factory=list)
    broadcaster_stake: Optional[str] = None
    share_asset_needed: Optional[str] = None
    consent_outreach_template: Optional[str] = None
    consent_posture: Literal["no-contact", "one-to-one-consent", "public-invitation"]
    anti_spam_rules: List[str] = Field(min_length=1)
    what_not_to_say: List[str] = Field(default_factory=list)
    max_contacts: int = Field(default=3, ge=0)
    likely_amplifier: Optional[str] = None
    failure_condition: Optional[FailureCondition] = None

    @field_validator("anti_spam_rules")
    @classmethod
    def must_have_a_rule(cls, v: List[str]) -> List[str]:
        if not any("one" in r.lower() or "once" in r.lower() for r in v):
            raise ValueError(
                "anti_spam_rules must include a contact limit such as 'One person, one message, once'"
            )
        return v


class FrictionItem(_Model):
    friction: str
    evidence: str
    fix: str


class FrictionAnalysis(_Model):
    share_friction_score: float = Field(ge=0, le=100)
    basis: Basis = Basis.MEASURED
    reasons: List[FrictionItem] = Field(min_length=1)
    reductions: List[str] = Field(default_factory=list)
    forwardable_artifact_exists: bool = False


class HonestyFinding(_Model):
    severity: Severity
    matched: str
    where: Optional[str] = None
    rule: str
    suggestion: str


class HonestyAudit(_Model):
    invented_stats_detected: bool
    fake_testimonials_detected: bool
    guaranteed_outcomes_detected: bool
    manufactured_outrage_detected: bool
    dark_patterns_detected: List[str] = Field(default_factory=list)
    required_fixes: List[str] = Field(default_factory=list)
    passed: bool
    findings: List[HonestyFinding] = Field(default_factory=list)
    scanned_for: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def passed_means_no_blockers(self) -> "HonestyAudit":
        blockers = [f for f in self.findings if f.severity == Severity.BLOCKER]
        if self.passed and blockers:
            raise ValueError(
                f"'passed' is true but there are {len(blockers)} blocker finding(s). "
                "A blocker cannot be ignored."
            )
        if not self.passed and not self.required_fixes:
            raise ValueError("a failed honesty audit must say what to fix, in required_fixes")
        return self


class ScoreDimension(_Model):
    key: str
    label: str
    weight: int = Field(ge=0, le=100)
    score: float = Field(ge=0, le=100)
    points: Optional[float] = Field(default=None, ge=0, le=100)
    basis: Basis
    confidence: Confidence
    evidence: List[str] = Field(min_length=1)
    assumptions: List[str] = Field(default_factory=list)
    missing_data: List[str] = Field(default_factory=list)
    improvement: str = Field(min_length=1)
    failure_condition: str = Field(min_length=1)
    do_not_launch_yet: bool = False

    @field_validator("evidence")
    @classmethod
    def evidence_must_be_specific(cls, v: List[str]) -> List[str]:
        if all(len(e.strip()) < 8 for e in v):
            raise ValueError("evidence entries must say something specific, not just 'n/a'")
        return v

    @model_validator(mode="after")
    def compute_points(self) -> "ScoreDimension":
        if self.points is None:
            object.__setattr__(self, "points", round(self.score * self.weight / 100, 2))
        return self


class Scorecard(_Model):
    aqi_version: str
    max: int = 1000
    total: float = Field(ge=0, le=1000)
    band: Optional[str] = None
    disclaimer: Optional[str] = None
    dimensions: List[ScoreDimension] = Field(min_length=1)

    @model_validator(mode="after")
    def total_matches_dimensions(self) -> "Scorecard":
        computed = round(sum((d.points or 0) for d in self.dimensions))
        if abs(computed - self.total) > 2:
            raise ValueError(
                f"scorecard.total is {self.total} but the dimensions sum to {computed}. "
                "A published total that does not add up is the exact failure this protocol exists to prevent."
            )
        return self


class LaunchAssets(_Model):
    hacker_news_title: Optional[str] = Field(default=None, max_length=80)
    show_hn_body: Optional[str] = None
    x_thread: Optional[List[str]] = None
    linkedin_post: Optional[str] = None
    product_hunt_tagline: Optional[str] = Field(default=None, max_length=60)
    product_hunt_description: Optional[str] = Field(default=None, max_length=260)
    email_announcement: Optional[str] = None
    email_subject_lines: Optional[List[str]] = None
    discord_message: Optional[str] = None
    landing_hero: Optional[str] = None
    one_line_broadcast_summary: Optional[str] = None
    alt_text: Optional[Dict[str, str]] = None
    placeholders_used: List[str] = Field(default_factory=list)

    @field_validator("x_thread")
    @classmethod
    def each_post_fits(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v:
            too_long = [p for p in v if len(p) > 280]
            if too_long:
                raise ValueError(f"{len(too_long)} post(s) exceed 280 characters")
        return v


class PreLaunchTest(_Model):
    name: str
    hypothesis: str
    cost: str
    success_criterion: str
    kill_criterion: str
    method: Optional[str] = None
    decision_it_changes: Optional[str] = None


class Experiments(_Model):
    pre_launch_tests: List[PreLaunchTest] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    kill_criteria: List[str] = Field(default_factory=list)
    kill_criteria_detail: List[FailureCondition] = Field(default_factory=list)
    measurement_plan: List[str] = Field(default_factory=list)
    pre_registered: bool = False


class PostLaunchLearning(_Model):
    signals_to_track: List[str] = Field(default_factory=list)
    questions_to_ask: List[str] = Field(default_factory=list)
    update_triggers: List[str] = Field(default_factory=list)
    outcome_recorded: bool = False
    outcome_evidence_label: Optional[EvidenceLabel] = None


class EthicalRisk(_Model):
    risk: str
    assessment: Literal["clear", "caution", "violation"]
    note: Optional[str] = None


class EthicsReview(_Model):
    ethical_risk_check: List[EthicalRisk] = Field(min_length=1)
    do_not_launch_yet: bool
    do_not_launch_reason: Optional[str] = None
    audience_could_read_this: bool = True
    reviewer: Literal["deterministic-rules", "human", "deterministic-rules+human"]

    @model_validator(mode="after")
    def blocking_needs_a_reason(self) -> "EthicsReview":
        if self.do_not_launch_yet and not self.do_not_launch_reason:
            raise ValueError("do_not_launch_yet is true, so do_not_launch_reason must say why")
        if any(r.assessment == "violation" for r in self.ethical_risk_check) and not self.do_not_launch_yet:
            raise ValueError("an ethical 'violation' was recorded but do_not_launch_yet is false")
        return self


class Accessibility(_Model):
    reading_level: Optional[str] = None
    jargon_density: Optional[float] = Field(default=None, ge=0, le=1)
    alt_text_present: Optional[bool] = None
    plain_language_rewrite: Optional[str] = None
    screen_reader_notes: List[str] = Field(default_factory=list)


class Generator(_Model):
    name: str
    version: str
    mode: Literal["deterministic", "llm-assisted", "local-model", "hybrid"] = "deterministic"
    provider: Optional[str] = None
    model: Optional[str] = None
    network_calls: int = Field(default=0, ge=0)


class ODSDocument(_Model):
    """A complete Open Diffusion Spec document."""

    ods_version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    document_id: Optional[str] = None
    generated_at: Optional[datetime] = None
    generator: Optional[Generator] = None
    artifact: Artifact
    provenance: Optional[Provenance] = None
    current_positioning: CurrentPositioning
    category_analysis: Optional[CategoryAnalysis] = None
    audience_analysis: Optional[AudienceAnalysis] = None
    broadcaster_analysis: Optional[BroadcasterAnalysis] = None
    friction_analysis: Optional[FrictionAnalysis] = None
    honesty_audit: HonestyAudit
    scorecard: Scorecard
    launch_assets: Optional[LaunchAssets] = None
    experiments: Optional[Experiments] = None
    failure_conditions: List[FailureCondition] = Field(min_length=1)
    post_launch_learning: Optional[PostLaunchLearning] = None
    ethics_review: EthicsReview
    accessibility: Optional[Accessibility] = None
    limitations: List[str] = Field(default_factory=list)
    # Extension namespace. ODS requires consumers to ignore unknown x_* fields,
    # and requires extensions never to be needed for validation.
    x_agents: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def honesty_failure_blocks_launch(self) -> "ODSDocument":
        if not self.honesty_audit.passed and not self.ethics_review.do_not_launch_yet:
            raise ValueError(
                "honesty_audit failed but ethics_review.do_not_launch_yet is false. "
                "A document cannot pass its own audit and still permit a launch."
            )
        return self


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

BANDS = [
    (0, 249, "Not ready", "Do not launch. Something structural is missing."),
    (250, 449, "Fragile", "Fix the weakest two dimensions before any distribution."),
    (450, 649, "Workable", "One narrow channel, one broadcaster, written kill criteria."),
    (650, 824, "Strong", "Defensible attempt. Still state what would make it fail."),
    (825, 1000, "Exceptional", "Rare. Re-audit honesty before launch; high scores attract scrutiny."),
]


def band_for(total: float) -> tuple[str, str]:
    for lo, hi, label, meaning in BANDS:
        if lo <= total <= hi:
            return label, meaning
    raise ValueError(f"score {total} is outside 0..1000")


def dimension(
    key: str,
    score: float,
    *,
    basis: Basis,
    confidence: Confidence,
    evidence: List[str],
    improvement: str,
    failure_condition: str,
    assumptions: Optional[List[str]] = None,
    missing_data: Optional[List[str]] = None,
    do_not_launch_yet: bool = False,
    weights: Optional[List[DimensionSpec]] = None,
) -> ScoreDimension:
    """Build a dimension, refusing to accept a score without its context."""
    specs = weights or dimension_specs()
    spec = next((s for s in specs if s.key == key), None)
    if spec is None:
        raise ValueError(f'unknown AQI dimension "{key}"')
    return ScoreDimension(
        key=key,
        label=spec.label,
        weight=spec.weight,
        score=max(0.0, min(100.0, float(score))),
        basis=basis,
        confidence=confidence,
        evidence=evidence,
        assumptions=assumptions or [],
        missing_data=missing_data or [],
        improvement=improvement,
        failure_condition=failure_condition,
        do_not_launch_yet=do_not_launch_yet,
    )


def compute_total(dimensions: List[ScoreDimension]) -> float:
    return min(1000.0, round(sum((d.points or 0) for d in dimensions), 2))


def weakest(dimensions: List[ScoreDimension]) -> ScoreDimension:
    return sorted(dimensions, key=lambda d: d.score)[0]


def top_leverage(dimensions: List[ScoreDimension], n: int = 3) -> List[ScoreDimension]:
    return sorted(
        dimensions, key=lambda d: (100 - d.score) * d.weight / 100, reverse=True
    )[:n]


# ---------------------------------------------------------------------------
# IO helpers
# ---------------------------------------------------------------------------


def validate_document(data: Dict[str, Any]) -> ODSDocument:
    """Parse and validate. Raises pydantic.ValidationError with the exact path."""
    return ODSDocument.model_validate(data)


def load_document(path: Path) -> ODSDocument:
    return validate_document(json.loads(path.read_text(encoding="utf-8")))


def dump_document(doc: ODSDocument) -> str:
    return doc.model_dump_json(indent=2, exclude_none=True, by_alias=True)


__all__ = [
    "AQI_MAX",
    "Accessibility",
    "AdjacentCategory",
    "Artifact",
    "AudienceAnalysis",
    "Basis",
    "BroadcasterAnalysis",
    "BroadcasterCandidate",
    "CategoryAnalysis",
    "Confidence",
    "CurrentPositioning",
    "DimensionSpec",
    "EthicalRisk",
    "EthicsReview",
    "EvidenceLabel",
    "Experiments",
    "FailureCondition",
    "FrictionAnalysis",
    "FrictionItem",
    "Generator",
    "HonestyAudit",
    "HonestyFinding",
    "LaunchAssets",
    "ODSDocument",
    "PostLaunchLearning",
    "PreLaunchTest",
    "Provenance",
    "Saturation",
    "Scorecard",
    "ScoreDimension",
    "Severity",
    "aqi_max",
    "assert_weights_sum_to_max",
    "band_for",
    "compute_total",
    "dimension",
    "dimension_specs",
    "dump_document",
    "load_document",
    "load_weights",
    "top_leverage",
    "validate_document",
    "weakest",
]

AQI_MAX = 1000
