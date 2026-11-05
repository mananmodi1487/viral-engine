package ods

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func weights(t *testing.T) *Weights {
	t.Helper()
	w, err := LoadWeights("")
	if err != nil {
		t.Fatalf("loading weights: %v", err)
	}
	return w
}

func TestWeightsSumToMax(t *testing.T) {
	w := weights(t)
	if len(w.Dimensions) != 20 {
		t.Fatalf("expected 20 dimensions, got %d", len(w.Dimensions))
	}
	sum := 0
	for _, d := range w.Dimensions {
		sum += d.Weight
	}
	if sum != w.Max {
		t.Fatalf("weights sum to %d, expected %d", sum, w.Max)
	}
}

func TestEveryDimensionAsksAQuestion(t *testing.T) {
	for _, d := range weights(t).Dimensions {
		if d.Question == "" {
			t.Errorf("%s has no question", d.Key)
		}
	}
}

func TestDimensionRequiresEvidence(t *testing.T) {
	w := weights(t)
	if _, err := NewDimension(w, "category_clarity", 50, BasisStructural, ConfidenceMedium, nil, "i", "f"); err == nil {
		t.Fatal("expected an error for a dimension with no evidence")
	}
}

func TestDimensionRequiresFailureCondition(t *testing.T) {
	w := weights(t)
	if _, err := NewDimension(w, "category_clarity", 50, BasisStructural, ConfidenceMedium, []string{"a real observation"}, "i", ""); err == nil {
		t.Fatal("expected an error for a dimension with no failure condition")
	}
}

func TestUnknownDimensionRejected(t *testing.T) {
	w := weights(t)
	if _, err := NewDimension(w, "vibes", 50, BasisHeuristic, ConfidenceLow, []string{"a real observation"}, "i", "f"); err == nil {
		t.Fatal("expected an error for an unknown dimension")
	}
}

func TestPointsAreWeightScaled(t *testing.T) {
	w := weights(t)
	d, err := NewDimension(w, "category_clarity", 50, BasisStructural, ConfidenceMedium, []string{"half the checks passed"}, "i", "f")
	if err != nil {
		t.Fatal(err)
	}
	if d.Weight != 85 {
		t.Fatalf("expected weight 85, got %d", d.Weight)
	}
	if d.Points != 42.5 {
		t.Fatalf("expected 42.5 points, got %v", d.Points)
	}
}

func TestScorecardTotalMustAddUp(t *testing.T) {
	w := weights(t)
	d, _ := NewDimension(w, "category_clarity", 100, BasisMeasured, ConfidenceHigh, []string{"all checks passed"}, "i", "f")
	sc := Scorecard{AQIVersion: "2.0.0", Max: 1000, Total: 5, Dimensions: []Dimension{*d}}
	if err := sc.Validate(); err == nil {
		t.Fatal("expected a mismatch error")
	}
	sc.Total = 85
	if err := sc.Validate(); err != nil {
		t.Fatalf("85 points should validate: %v", err)
	}
}

func TestHonestyBlockerCannotPass(t *testing.T) {
	a := HonestyAudit{
		Passed:   true,
		Findings: []HonestyFinding{{Severity: SeverityBlocker, Matched: "10x", Rule: "multiplier"}},
	}
	if err := a.Validate(); err == nil {
		t.Fatal("expected an audit with a blocker to fail its own validation")
	}
}

func TestUnknownSaturationNeedsReason(t *testing.T) {
	c := CategoryAnalysis{SaturationEstimate: "unknown", RecommendedCategory: "c", CategoryConfidence: 0.2}
	if err := c.Validate(); err == nil {
		t.Fatal("expected unknown saturation without missing_data to fail")
	}
	c.MissingData = []string{"no count was measured"}
	if err := c.Validate(); err != nil {
		t.Fatalf("unknown saturation with a reason should validate: %v", err)
	}
}

func TestEthicalViolationForcesBlock(t *testing.T) {
	e := EthicsReview{
		EthicalRiskCheck: []EthicalRisk{{Risk: "deception", Assessment: "violation"}},
		DoNotLaunchYet:   false,
		Reviewer:         "deterministic-rules",
	}
	if err := e.Validate(); err == nil {
		t.Fatal("expected a recorded violation to force do_not_launch_yet")
	}
}

func TestBroadcasterRulesRequired(t *testing.T) {
	b := BroadcasterAnalysis{PrimaryBroadcasterType: "writer", ConsentPosture: "one-to-one-consent"}
	if err := b.Validate(); err == nil {
		t.Fatal("expected empty anti_spam_rules to fail")
	}
	b.AntiSpamRules = []string{"One person, one message, once."}
	if err := b.Validate(); err != nil {
		t.Fatalf("valid broadcaster analysis rejected: %v", err)
	}
}

func TestBandsCoverTheWholeRange(t *testing.T) {
	w := weights(t)
	if l, _, err := w.BandFor(0); err != nil || l != "Not ready" {
		t.Fatalf("band at 0: %q %v", l, err)
	}
	if l, _, err := w.BandFor(1000); err != nil || l != "Exceptional" {
		t.Fatalf("band at 1000: %q %v", l, err)
	}
	if _, _, err := w.BandFor(1001); err == nil {
		t.Fatal("expected 1001 to be out of range")
	}
}

func TestWeakestAndLeverage(t *testing.T) {
	w := weights(t)
	a, _ := NewDimension(w, "category_clarity", 20, BasisHeuristic, ConfidenceLow, []string{"low observed"}, "i", "f")
	b, _ := NewDimension(w, "accessibility", 30, BasisHeuristic, ConfidenceLow, []string{"low observed"}, "i", "f")
	dims := []Dimension{*a, *b}
	weak, ok := Weakest(dims)
	if !ok || weak.Key != "category_clarity" {
		t.Fatalf("expected category_clarity as weakest, got %q", weak.Key)
	}
	top := TopLeverage(dims, 1)
	if len(top) != 1 || top[0].Key != "category_clarity" {
		t.Fatalf("expected category_clarity as top leverage (64 lost vs 28), got %+v", top)
	}
}

func TestPublishedExampleValidates(t *testing.T) {
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 8; i++ {
		candidate := filepath.Join(dir, "protocol", "examples", "ods-example.json")
		if _, err := os.Stat(candidate); err == nil {
			raw, err := os.ReadFile(candidate)
			if err != nil {
				t.Fatal(err)
			}
			var doc Document
			if err := json.Unmarshal(raw, &doc); err != nil {
				t.Fatalf("unmarshalling the published example: %v", err)
			}
			if err := doc.Validate(); err != nil {
				t.Fatalf("the published example does not validate: %v", err)
			}
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	t.Skip("published example not found")
}
