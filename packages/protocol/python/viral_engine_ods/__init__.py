"""viral-engine-ods — Python implementation of the Open Diffusion Spec 1.0.

Reads the same weight file as the TypeScript reference implementation, so a score
computed here equals a score computed there.

    >>> from viral_engine_ods import dimension, compute_total, Basis, Confidence
    >>> d = dimension("category_clarity", 24, basis=Basis.STRUCTURAL,
    ...               confidence=Confidence.MEDIUM, evidence=["no explicit pairing"],
    ...               improvement="Add a not-X-but-Y sentence",
    ...               failure_condition="Readers still say 'just another X'")
    >>> compute_total([d])
    19.2
"""

from .models import (  # noqa: F401
    AQI_MAX,
    Accessibility,
    AdjacentCategory,
    Artifact,
    AudienceAnalysis,
    Basis,
    BroadcasterAnalysis,
    BroadcasterCandidate,
    CategoryAnalysis,
    Confidence,
    CurrentPositioning,
    DimensionSpec,
    EthicalRisk,
    EthicsReview,
    EvidenceLabel,
    Experiments,
    FailureCondition,
    FrictionAnalysis,
    FrictionItem,
    Generator,
    HonestyAudit,
    HonestyFinding,
    LaunchAssets,
    ODSDocument,
    PostLaunchLearning,
    PreLaunchTest,
    Provenance,
    Saturation,
    Scorecard,
    ScoreDimension,
    Severity,
    aqi_max,
    assert_weights_sum_to_max,
    band_for,
    compute_total,
    dimension,
    dimension_specs,
    dump_document,
    load_document,
    load_weights,
    top_leverage,
    validate_document,
    weakest,
)

__version__ = "1.0.0"
