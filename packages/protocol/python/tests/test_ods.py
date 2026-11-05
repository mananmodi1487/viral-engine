"""Tests for the Python ODS implementation.

These assert the properties the protocol promises, not that the code runs. A test
that only checks "no exception" would let the interesting guarantees rot.
"""

import json
import unittest
from pathlib import Path

from viral_engine_ods import (
    AQI_MAX,
    Accessibility,
    Artifact,
    Basis,
    BroadcasterAnalysis,
    BroadcasterCandidate,
    Confidence,
    CurrentPositioning,
    EthicsReview,
    EthicalRisk,
    FailureCondition,
    HonestyAudit,
    ODSDocument,
    Provenance,
    Scorecard,
    Saturation,
    Severity,
    assert_weights_sum_to_max,
    band_for,
    compute_total,
    dimension,
    dimension_specs,
    top_leverage,
    validate_document,
    weakest,
)


def honest_audit(**over) -> HonestyAudit:
    base = dict(
        invented_stats_detected=False,
        fake_testimonials_detected=False,
        guaranteed_outcomes_detected=False,
        manufactured_outrage_detected=False,
        passed=True,
    )
    base.update(over)
    return HonestyAudit(**base)


def one_dimension() -> dict:
    d = dimension("category_clarity", 50, basis=Basis.HEURISTIC, confidence=Confidence.LOW,
                  evidence=["structural checks only"], improvement="i", failure_condition="f")
    return d.model_dump()


def minimal_doc(**over) -> dict:
    doc = {
        "ods_version": "1.0.0",
        "artifact": {"id": "x", "name": "X", "type": "github-repo"},
        "current_positioning": {"one_sentence_description": "d", "claimed_category": "c"},
        "honesty_audit": honest_audit().model_dump(),
        "scorecard": {"aqi_version": "1.0.0", "total": 40, "dimensions": [one_dimension()]},
        "failure_conditions": [
            {"statement": "fails if generic", "observable": "same report", "horizon": "immediately"}
        ],
        "ethics_review": {"ethical_risk_check": [{"risk": "spam", "assessment": "caution"}],
                          "do_not_launch_yet": False, "reviewer": "deterministic-rules"},
    }
    doc.update(over)
    return doc


class TestWeights(unittest.TestCase):
    def test_weights_sum_to_max(self):
        self.assertEqual(assert_weights_sum_to_max(), AQI_MAX)

    def test_twenty_dimensions(self):
        self.assertEqual(len(dimension_specs()), 20)

    def test_every_dimension_has_a_question(self):
        for s in dimension_specs():
            self.assertTrue(s.question.endswith("?"), s.key)


class TestScoring(unittest.TestCase):
    def test_points_are_weight_scaled(self):
        d = dimension(
            "category_clarity", 50,
            basis=Basis.STRUCTURAL, confidence=Confidence.MEDIUM,
            evidence=["half of the structural checks passed"],
            improvement="add a pairing",
            failure_condition="readers describe it as the old category",
        )
        self.assertEqual(d.weight, 80)
        self.assertEqual(d.points, 40.0)

    def test_total_equals_sum_of_dimensions(self):
        dims = [
            dimension(k, 50, basis=Basis.HEURISTIC, confidence=Confidence.LOW,
                      evidence=["evaluated"], improvement="i", failure_condition="f")
            for k in ("category_clarity", "honesty_integrity", "accessibility")
        ]
        self.assertAlmostEqual(compute_total(dims), sum(d.points for d in dims))

    def test_unknown_dimension_is_rejected(self):
        with self.assertRaises(ValueError):
            dimension("made_up", 50, basis=Basis.HEURISTIC, confidence=Confidence.LOW,
                      evidence=["some specific evidence string"], improvement="i", failure_condition="f")

    def test_evidence_is_mandatory(self):
        with self.assertRaises(Exception):
            dimension("category_clarity", 50, basis=Basis.HEURISTIC,
                      confidence=Confidence.LOW, evidence=[], improvement="i", failure_condition="f")

    def test_weakest_and_leverage(self):
        dims = [
            dimension("category_clarity", 20, basis=Basis.HEURISTIC, confidence=Confidence.LOW,
                      evidence=["evidence text for the dimension"], improvement="i", failure_condition="f"),
            dimension("accessibility", 30, basis=Basis.HEURISTIC, confidence=Confidence.LOW,
                      evidence=["evidence text for the dimension"], improvement="i", failure_condition="f"),
        ]
        self.assertEqual(weakest(dims).key, "category_clarity")
        # category_clarity loses 64 points, accessibility loses 28
        self.assertEqual(top_leverage(dims)[0].key, "category_clarity")

    def test_bands_are_contiguous_and_complete(self):
        self.assertEqual(band_for(0)[0], "Not ready")
        self.assertEqual(band_for(250)[0], "Fragile")
        self.assertEqual(band_for(1000)[0], "Exceptional")
        with self.assertRaises(ValueError):
            band_for(1001)


class TestDocument(unittest.TestCase):
    def test_minimal_document_validates(self):
        doc = validate_document(minimal_doc())
        self.assertEqual(doc.ods_version, "1.0.0")

    def test_failure_conditions_are_required(self):
        with self.assertRaises(Exception):
            validate_document(minimal_doc(failure_conditions=[]))

    def test_honesty_failure_must_block_launch(self):
        data = minimal_doc(honesty_audit=honest_audit(
            passed=False,
            findings=[{"severity": "blocker", "matched": "10x", "rule": "multiplier",
                       "suggestion": "give a baseline"}],
            required_fixes=["remove the multiplier"],
        ).model_dump())
        with self.assertRaises(Exception):
            validate_document(data)

    def test_unknown_saturation_needs_missing_data(self):
        data = minimal_doc(category_analysis={
            "saturation_estimate": "unknown",
            "recommended_category": "c",
            "category_confidence": 0.2,
        })
        with self.assertRaises(Exception):
            validate_document(data)

    def test_ethics_violation_forces_block(self):
        with self.assertRaises(Exception):
            EthicsReview(
                ethical_risk_check=[EthicalRisk(risk="deception", assessment="violation")],
                do_not_launch_yet=False,
                reviewer="deterministic-rules",
            )

    def test_blocking_needs_a_reason(self):
        with self.assertRaises(Exception):
            EthicsReview(
                ethical_risk_check=[EthicalRisk(risk="spam", assessment="caution")],
                do_not_launch_yet=True,
                reviewer="deterministic-rules",
            )

    def test_scorecard_total_that_does_not_add_up_is_rejected(self):
        d = dimension("category_clarity", 100, basis=Basis.MEASURED,
                      confidence=Confidence.HIGH, evidence=["all checks passed"],
                      improvement="i", failure_condition="f")
        with self.assertRaises(Exception):
            Scorecard(aqi_version="1.0.0", total=5, dimensions=[d])

    def test_anti_spam_rules_need_a_limit(self):
        with self.assertRaises(Exception):
            BroadcasterAnalysis(
                primary_broadcaster_type="writer",
                consent_posture="one-to-one-consent",
                anti_spam_rules=["be nice"],
            )

    def test_unknown_fields_are_rejected(self):
        data = minimal_doc()
        data["surprise"] = True
        with self.assertRaises(Exception):
            validate_document(data)


class TestExample(unittest.TestCase):
    def test_published_example_validates(self):
        path = Path(__file__).resolve().parents[4] / "protocol" / "examples" / "ods-example.json"
        if not path.exists():
            self.skipTest("example not present")
        validate_document(json.loads(path.read_text()))


if __name__ == "__main__":
    unittest.main()
