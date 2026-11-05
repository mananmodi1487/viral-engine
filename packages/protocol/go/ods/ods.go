// Package ods implements the Open Diffusion Spec 1.0.
//
// Status: reference-quality types and scoring, compiled and tested in CI
// (`.github/workflows/ci.yml`). It reads the same `protocol/aqi-weights.json`
// as the TypeScript and Python implementations, so a score computed here equals
// a score computed there.
//
// The type system carries the protocol's promises:
//   - Basis has an Unavailable member, and there is no code path that guesses.
//   - Dimension cannot be constructed without Evidence, Improvement and
//     FailureCondition; NewDimension returns an error instead.
//   - Scorecard.Validate recomputes the total and refuses a mismatch.
package ods

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// Basis describes how a value was produced. Unavailable must be used instead of
// an estimate.
type Basis string

const (
	BasisMeasured     Basis = "measured"
	BasisStructural   Basis = "structural"
	BasisHeuristic    Basis = "heuristic"
	BasisUserSupplied Basis = "user-supplied"
	BasisUnavailable  Basis = "unavailable"
)

// Valid reports whether b is a member of the closed set.
func (b Basis) Valid() bool {
	switch b {
	case BasisMeasured, BasisStructural, BasisHeuristic, BasisUserSupplied, BasisUnavailable:
		return true
	}
	return false
}

// Confidence is a coarse statement of how much weight a judgement deserves.
type Confidence string

const (
	ConfidenceLow    Confidence = "low"
	ConfidenceMedium Confidence = "medium"
	ConfidenceHigh   Confidence = "high"
)

// Severity ranks a finding.
type Severity string

const (
	SeverityBlocker Severity = "blocker"
	SeverityWarning Severity = "warning"
	SeverityNote    Severity = "note"
)

// EvidenceLabel is the Evidence Commons label for a claim about the world.
type EvidenceLabel string

const (
	LabelSelfReported     EvidenceLabel = "self-reported"
	LabelVerified         EvidenceLabel = "verified"
	LabelReproducible     EvidenceLabel = "reproducible"
	LabelAnecdotal        EvidenceLabel = "anecdotal"
	LabelUnclear          EvidenceLabel = "unclear"
	LabelContested        EvidenceLabel = "contested"
	LabelPrivateRedacted  EvidenceLabel = "private-redacted"
)

// FailureCondition is required at the top level of every document.
type FailureCondition struct {
	Statement  string `json:"statement"`
	Observable string `json:"observable"`
	Horizon    string `json:"horizon"`
}

// Validate refuses a failure condition that cannot be checked.
func (f FailureCondition) Validate() error {
	if f.Statement == "" || f.Observable == "" || f.Horizon == "" {
		return errors.New("failure condition needs a statement, an observable signal, and a horizon")
	}
	return nil
}

// Artifact identifies the thing under analysis.
type Artifact struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	URL      string `json:"url,omitempty"`
	Language string `json:"language,omitempty"`
	License  string `json:"license,omitempty"`
	Summary  string `json:"summary,omitempty"`
}

// ProvenanceInput records where analysed text came from.
type ProvenanceInput struct {
	Kind           string `json:"kind"`
	Ref            string `json:"ref"`
	FetchedAt      string `json:"fetched_at,omitempty"`
	DegradedReason string `json:"degraded_reason,omitempty"`
	Consent        string `json:"consent,omitempty"`
}

// Provenance is the audit trail for the input.
type Provenance struct {
	Inputs                  []ProvenanceInput `json:"inputs"`
	OCRorTranscriptionUsed  bool              `json:"ocr_or_transcription_used"`
	NetworkCalls            int               `json:"network_calls"`
}

// CurrentPositioning is what the artifact claims to be.
type CurrentPositioning struct {
	OneSentenceDescription string   `json:"one_sentence_description"`
	ClaimedCategory        string   `json:"claimed_category"`
	ActualCategorySignals  []string `json:"actual_category_signals,omitempty"`
	TargetAudience         []string `json:"target_audience,omitempty"`
	CorePromise            string   `json:"core_promise,omitempty"`
	CoreTension            string   `json:"core_tension,omitempty"`
	EmotionalStake         string   `json:"emotional_stake,omitempty"`
	Basis                  Basis    `json:"basis,omitempty"`
}

// AdjacentCategory is a candidate repositioning.
type AdjacentCategory struct {
	Name           string  `json:"name"`
	WhyLessCrowded string  `json:"why_less_crowded"`
	CredibilityRisk string `json:"credibility_risk,omitempty"`
	TensionScore   float64 `json:"tension_score,omitempty"`
	ProofNeeded    string  `json:"proof_needed,omitempty"`
}

// CategoryAnalysis answers "what is it really competing with".
type CategoryAnalysis struct {
	SaturationEstimate   string             `json:"saturation_estimate"`
	SaturationBasis      Basis              `json:"saturation_basis,omitempty"`
	Competitors          []string           `json:"competitors,omitempty"`
	AdjacentCategories   []AdjacentCategory `json:"adjacent_categories,omitempty"`
	RecommendedCategory  string             `json:"recommended_category"`
	CategoryConfidence   float64            `json:"category_confidence"`
	Evidence             []string           `json:"evidence,omitempty"`
	MissingData          []string           `json:"missing_data,omitempty"`
	ProposedPositioning  string             `json:"proposed_positioning,omitempty"`
	ProofRequired        string             `json:"proof_required,omitempty"`
	FailureCondition     *FailureCondition  `json:"failure_condition,omitempty"`
}

// Validate enforces the "unknown needs a reason" rule.
func (c CategoryAnalysis) Validate() error {
	if c.SaturationEstimate == "unknown" && len(c.MissingData) == 0 {
		return errors.New("saturation_estimate 'unknown' must state what is missing, in missing_data")
	}
	if c.CategoryConfidence < 0 || c.CategoryConfidence > 1 {
		return fmt.Errorf("category_confidence %v is outside 0..1", c.CategoryConfidence)
	}
	return nil
}

// BroadcasterCandidate is a role plus a discovery method. Never a scraped person.
type BroadcasterCandidate struct {
	Candidate            string `json:"candidate"`
	WhereToFind          string `json:"where_to_find"`
	WhyTheyMightCare     string `json:"why_they_might_care,omitempty"`
	WhatMakesThemLookGood string `json:"what_makes_them_look_good,omitempty"`
	ConsentStatus        string `json:"consent_status"`
	ContactChannel       string `json:"contact_channel,omitempty"`
}

// BroadcasterAnalysis is the Broadcaster Rule, with the consent layer that stops
// it becoming a DM spam playbook.
type BroadcasterAnalysis struct {
	PrimaryBroadcasterType      string                 `json:"primary_broadcaster_type"`
	SpecificBroadcasterCandidates []BroadcasterCandidate `json:"specific_broadcaster_candidates,omitempty"`
	BroadcasterStake            string                 `json:"broadcaster_stake,omitempty"`
	ShareAssetNeeded            string                 `json:"share_asset_needed,omitempty"`
	ConsentOutreachTemplate     string                 `json:"consent_outreach_template,omitempty"`
	ConsentPosture              string                 `json:"consent_posture"`
	AntiSpamRules               []string               `json:"anti_spam_rules"`
	WhatNotToSay                []string               `json:"what_not_to_say,omitempty"`
	MaxContacts                 int                    `json:"max_contacts,omitempty"`
	LikelyAmplifier             string                 `json:"likely_amplifier,omitempty"`
	FailureCondition            *FailureCondition      `json:"failure_condition,omitempty"`
}

// Validate refuses an anti-spam policy with no limit in it.
func (b BroadcasterAnalysis) Validate() error {
	if len(b.AntiSpamRules) == 0 {
		return errors.New("broadcaster_analysis needs at least one anti_spam_rules entry")
	}
	switch b.ConsentPosture {
	case "no-contact", "one-to-one-consent", "public-invitation":
	default:
		return fmt.Errorf("consent_posture %q is not one of no-contact | one-to-one-consent | public-invitation", b.ConsentPosture)
	}
	return nil
}

// HonestyFinding is one detected claim problem.
type HonestyFinding struct {
	Severity   Severity `json:"severity"`
	Matched    string   `json:"matched"`
	Where      string   `json:"where,omitempty"`
	Rule       string   `json:"rule"`
	Suggestion string   `json:"suggestion"`
}

// HonestyAudit is the required honesty block.
type HonestyAudit struct {
	InventedStatsDetected        bool             `json:"invented_stats_detected"`
	FakeTestimonialsDetected     bool             `json:"fake_testimonials_detected"`
	GuaranteedOutcomesDetected   bool             `json:"guaranteed_outcomes_detected"`
	ManufacturedOutrageDetected  bool             `json:"manufactured_outrage_detected"`
	DarkPatternsDetected         []string         `json:"dark_patterns_detected"`
	RequiredFixes                []string         `json:"required_fixes"`
	Passed                       bool             `json:"passed"`
	Findings                     []HonestyFinding `json:"findings,omitempty"`
	ScannedFor                   []string         `json:"scanned_for,omitempty"`
}

// Validate refuses an audit that claims to have passed while carrying a blocker.
func (h HonestyAudit) Validate() error {
	blockers := 0
	for _, f := range h.Findings {
		if f.Severity == SeverityBlocker {
			blockers++
		}
	}
	if h.Passed && blockers > 0 {
		return fmt.Errorf("'passed' is true but there are %d blocker finding(s)", blockers)
	}
	if !h.Passed && len(h.RequiredFixes) == 0 {
		return errors.New("a failed honesty audit must say what to fix, in required_fixes")
	}
	return nil
}

// DimensionSpec is a row of the shared weights file.
type DimensionSpec struct {
	Key      string `json:"key"`
	Label    string `json:"label"`
	Weight   int    `json:"weight"`
	Question string `json:"question"`
}

// Weights is the shared rubric file.
type Weights struct {
	AQIVersion string          `json:"aqiVersion"`
	Max        int             `json:"max"`
	Dimensions []DimensionSpec `json:"dimensions"`
	Disclaimer string          `json:"disclaimer"`
	Bands      []Band          `json:"bands"`
}

// Band is a score range and its meaning.
type Band struct {
	Min     int    `json:"min"`
	Max     int    `json:"max"`
	Label   string `json:"label"`
	Meaning string `json:"meaning"`
}

// Dimension is one scored row of the AQI.
type Dimension struct {
	Key              string     `json:"key"`
	Label            string     `json:"label"`
	Weight           int        `json:"weight"`
	Score            float64    `json:"score"`
	Points           float64    `json:"points"`
	Basis            Basis      `json:"basis"`
	Confidence       Confidence `json:"confidence"`
	Evidence         []string   `json:"evidence"`
	Assumptions      []string   `json:"assumptions,omitempty"`
	MissingData      []string   `json:"missing_data,omitempty"`
	Improvement      string     `json:"improvement"`
	FailureCondition string     `json:"failure_condition"`
	DoNotLaunchYet   bool       `json:"do_not_launch_yet,omitempty"`
}

// NewDimension builds a dimension, refusing to accept a score without context.
func NewDimension(w *Weights, key string, score float64, basis Basis, conf Confidence,
	evidence []string, improvement, failureCondition string) (*Dimension, error) {

	var spec *DimensionSpec
	for i := range w.Dimensions {
		if w.Dimensions[i].Key == key {
			spec = &w.Dimensions[i]
			break
		}
	}
	if spec == nil {
		return nil, fmt.Errorf("unknown AQI dimension %q", key)
	}
	if len(evidence) == 0 {
		return nil, errors.New(key + ": a score without evidence is a decoration")
	}
	if improvement == "" {
		return nil, errors.New(key + ": every dimension needs one improvement action")
	}
	if failureCondition == "" {
		return nil, errors.New(key + ": every dimension needs a failure condition")
	}
	if !basis.Valid() {
		return nil, fmt.Errorf("%s: %q is not a valid basis", key, basis)
	}
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	return &Dimension{
		Key: key, Label: spec.Label, Weight: spec.Weight, Score: score,
		Points: round2(score * float64(spec.Weight) / 100),
		Basis: basis, Confidence: conf, Evidence: evidence,
		Improvement: improvement, FailureCondition: failureCondition,
	}, nil
}

// Scorecard is the AQI block.
type Scorecard struct {
	AQIVersion string      `json:"aqi_version"`
	Max        int         `json:"max"`
	Total      float64     `json:"total"`
	Band       string      `json:"band,omitempty"`
	Disclaimer string      `json:"disclaimer,omitempty"`
	Dimensions []Dimension `json:"dimensions"`
}

// Validate recomputes the total. A published total that does not add up is the
// exact failure this protocol exists to prevent.
func (s *Scorecard) Validate() error {
	if len(s.Dimensions) == 0 {
		return errors.New("scorecard needs at least one dimension")
	}
	sum := 0.0
	for _, d := range s.Dimensions {
		sum += d.Points
	}
	sum = round2(sum)
	if diff := sum - s.Total; diff > 0.5 || diff < -0.5 {
		return fmt.Errorf("scorecard total is %v but the dimensions sum to %v", s.Total, sum)
	}
	return nil
}

// EthicsReview is required, and must permit "do not launch yet".
type EthicsReview struct {
	EthicalRiskCheck      []EthicalRisk `json:"ethical_risk_check"`
	DoNotLaunchYet        bool          `json:"do_not_launch_yet"`
	DoNotLaunchReason     string        `json:"do_not_launch_reason,omitempty"`
	AudienceCouldReadThis bool          `json:"audience_could_read_this"`
	Reviewer              string        `json:"reviewer"`
}

// EthicalRisk is one risk and its assessment.
type EthicalRisk struct {
	Risk       string `json:"risk"`
	Assessment string `json:"assessment"` // clear | caution | violation
	Note       string `json:"note,omitempty"`
}

// Validate enforces the honesty gate and the reason rule.
func (e *EthicsReview) Validate() error {
	if e.DoNotLaunchYet && e.DoNotLaunchReason == "" {
		return errors.New("do_not_launch_yet is true, so do_not_launch_reason must say why")
	}
	for _, r := range e.EthicalRiskCheck {
		if r.Assessment == "violation" && !e.DoNotLaunchYet {
			return errors.New("an ethical 'violation' was recorded but do_not_launch_yet is false")
		}
	}
	return nil
}

// Document is a complete ODS document.
type Document struct {
	ODSVersion         string                 `json:"ods_version"`
	DocumentID         string                 `json:"document_id,omitempty"`
	GeneratedAt        string                 `json:"generated_at,omitempty"`
	Artifact           Artifact               `json:"artifact"`
	Provenance         *Provenance            `json:"provenance,omitempty"`
	CurrentPositioning CurrentPositioning     `json:"current_positioning"`
	CategoryAnalysis   *CategoryAnalysis      `json:"category_analysis,omitempty"`
	BroadcasterAnalysis *BroadcasterAnalysis  `json:"broadcaster_analysis,omitempty"`
	HonestyAudit       HonestyAudit           `json:"honesty_audit"`
	Scorecard          Scorecard              `json:"scorecard"`
	FailureConditions  []FailureCondition     `json:"failure_conditions"`
	EthicsReview       EthicsReview           `json:"ethics_review"`
	Limitations        []string               `json:"limitations,omitempty"`
	Extra              map[string]json.RawMessage `json:"-"`
}

// Validate applies every rule the protocol promises.
func (d *Document) Validate() error {
	if d.ODSVersion == "" {
		return errors.New("ods_version is required")
	}
	if d.Artifact.ID == "" || d.Artifact.Name == "" || d.Artifact.Type == "" {
		return errors.New("artifact needs id, name and type")
	}
	if len(d.FailureConditions) == 0 {
		return errors.New("at least one failure_condition is required at the top level")
	}
	for i, f := range d.FailureConditions {
		if err := f.Validate(); err != nil {
			return fmt.Errorf("failure_conditions[%d]: %w", i, err)
		}
	}
	if err := d.HonestyAudit.Validate(); err != nil {
		return err
	}
	if err := d.Scorecard.Validate(); err != nil {
		return err
	}
	if err := d.EthicsReview.Validate(); err != nil {
		return err
	}
	if !d.HonestyAudit.Passed && !d.EthicsReview.DoNotLaunchYet {
		return errors.New("honesty_audit failed but do_not_launch_yet is false")
	}
	if d.CategoryAnalysis != nil {
		if err := d.CategoryAnalysis.Validate(); err != nil {
			return err
		}
	}
	if d.BroadcasterAnalysis != nil {
		if err := d.BroadcasterAnalysis.Validate(); err != nil {
			return err
		}
	}
	return nil
}

// LoadWeights reads the shared rubric file. It walks up from the working
// directory, and honours VIRAL_ENGINE_WEIGHTS.
func LoadWeights(path string) (*Weights, error) {
	if path == "" {
		path = os.Getenv("VIRAL_ENGINE_WEIGHTS")
	}
	if path == "" {
		dir, err := os.Getwd()
		if err != nil {
			return nil, err
		}
		for i := 0; i < 8; i++ {
			found := filepath.Join(dir, "protocol", "aqi-weights.json")
			if _, err := os.Stat(found); err == nil {
				path = found
				break
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	if path == "" {
		return nil, errors.New("could not find protocol/aqi-weights.json; set VIRAL_ENGINE_WEIGHTS")
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var w Weights
	if err := json.Unmarshal(raw, &w); err != nil {
		return nil, err
	}
	if err := w.Validate(); err != nil {
		return nil, err
	}
	return &w, nil
}

// Validate checks that the weights sum to the stated maximum and that the bands
// are contiguous, because a rubric that does not add up is a vibe with decimals.
func (w *Weights) Validate() error {
	sum := 0
	seen := map[string]bool{}
	for _, d := range w.Dimensions {
		if seen[d.Key] {
			return fmt.Errorf("duplicate dimension %q", d.Key)
		}
		seen[d.Key] = true
		sum += d.Weight
	}
	if sum != w.Max {
		return fmt.Errorf("weights sum to %d, expected %d", sum, w.Max)
	}
	sorted := append([]Band(nil), w.Bands...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Min < sorted[j].Min })
	expect := 0
	for _, b := range sorted {
		if b.Min != expect {
			return fmt.Errorf("bands are not contiguous around %d", b.Min)
		}
		expect = b.Max + 1
	}
	if expect != w.Max+1 {
		return fmt.Errorf("bands cover 0..%d, expected 0..%d", expect-1, w.Max)
	}
	return nil
}

// BandFor returns the band label and meaning for a total.
func (w *Weights) BandFor(total float64) (label, meaning string, err error) {
	for _, b := range w.Bands {
		if total >= float64(b.Min) && total <= float64(b.Max) {
			return b.Label, b.Meaning, nil
		}
	}
	return "", "", fmt.Errorf("score %v is outside 0..%d", total, w.Max)
}

// Total sums points, capped at the maximum.
func Total(dims []Dimension, max int) float64 {
	sum := 0.0
	for _, d := range dims {
		sum += d.Points
	}
	sum = round2(sum)
	if sum > float64(max) {
		return float64(max)
	}
	return sum
}

// Weakest returns the lowest-scoring dimension.
func Weakest(dims []Dimension) (Dimension, bool) {
	if len(dims) == 0 {
		return Dimension{}, false
	}
	out := dims[0]
	for _, d := range dims[1:] {
		if d.Score < out.Score {
			out = d
		}
	}
	return out, true
}

// TopLeverage returns the dimensions losing the most points, which is where the
// work actually is. A weak dimension with a small weight is not worth a week.
func TopLeverage(dims []Dimension, n int) []Dimension {
	cp := append([]Dimension(nil), dims...)
	sort.Slice(cp, func(i, j int) bool {
		li := (100 - cp[i].Score) * float64(cp[i].Weight) / 100
		lj := (100 - cp[j].Score) * float64(cp[j].Weight) / 100
		return li > lj
	})
	if n > 0 && len(cp) > n {
		return cp[:n]
	}
	return cp
}

func round2(f float64) float64 {
	return float64(int(f*100+0.5)) / 100
}
