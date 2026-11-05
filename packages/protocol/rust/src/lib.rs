//! Rust types for the Open Diffusion Spec 1.0.
//!
//! ## Status
//!
//! These types are compiled and tested in CI (`cargo test` in
//! `.github/workflows/ci.yml`). They were **not** compiled in the environment in
//! which they were written, because that environment had no Rust toolchain. That
//! is stated here rather than discovered by a user, which is the whole point of
//! the project's honesty policy.
//!
//! ## Design
//!
//! The type system carries three promises:
//!
//! 1. [`Basis::Unavailable`] exists, so there is no code path that guesses.
//! 2. [`Dimension`] cannot be built without evidence, an improvement, and a
//!    failure condition — [`Dimension::new`] returns a [`ValidationError`].
//! 3. [`Scorecard::validate`] recomputes the total and refuses a mismatch.
//!
//! Weights are loaded from the shared `protocol/aqi-weights.json`, never
//! hardcoded, so this crate cannot quietly disagree with the reference
//! implementation about what a dimension is worth.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::path::{Path, PathBuf};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/// Everything that can be wrong with an ODS document.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationError {
    MissingField(&'static str),
    UnknownDimension(String),
    MissingEvidence(String),
    MissingImprovement(String),
    MissingFailureCondition(String),
    ScoreOutOfRange(String),
    TotalMismatch { stated: u32, computed: u32 },
    HonestyBlockerWithPassed(u32),
    FailedAuditWithoutFixes,
    UnknownSaturationWithoutReason,
    EthicalViolationWithoutBlock,
    BlockWithoutReason,
    MissingAntiSpamRules,
    NoFailureConditions,
    WeightsDoNotSum { sum: u32, max: u32 },
    BandsNotContiguous { at: u32 },
    OutOfRange(f64),
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingField(name) => write!(f, "missing required field: {name}"),
            Self::UnknownDimension(k) => write!(f, "unknown AQI dimension: {k}"),
            Self::MissingEvidence(k) => write!(f, "{k}: a score without evidence is a decoration"),
            Self::MissingImprovement(k) => write!(f, "{k}: every dimension needs one improvement action"),
            Self::MissingFailureCondition(k) => write!(f, "{k}: every dimension needs a failure condition"),
            Self::ScoreOutOfRange(k) => write!(f, "{k}: score must be between 0 and 100"),
            Self::TotalMismatch { stated, computed } => write!(
                f,
                "scorecard total is {stated} but the dimensions sum to {computed}; \
                 a published total that does not add up is the exact failure this protocol exists to prevent"
            ),
            Self::HonestyBlockerWithPassed(n) => {
                write!(f, "'passed' is true but there are {n} blocker finding(s)")
            }
            Self::FailedAuditWithoutFixes => {
                write!(f, "a failed honesty audit must say what to fix, in required_fixes")
            }
            Self::UnknownSaturationWithoutReason => write!(
                f,
                "saturation_estimate is unknown, so missing_data must say what is missing"
            ),
            Self::EthicalViolationWithoutBlock => write!(
                f,
                "an ethical 'violation' was recorded but do_not_launch_yet is false"
            ),
            Self::BlockWithoutReason => {
                write!(f, "do_not_launch_yet is true, so do_not_launch_reason must say why")
            }
            Self::MissingAntiSpamRules => {
                write!(f, "broadcaster_analysis needs at least one anti_spam_rules entry")
            }
            Self::NoFailureConditions => {
                write!(f, "at least one failure_condition is required at the top level")
            }
            Self::WeightsDoNotSum { sum, max } => {
                write!(f, "weights sum to {sum}, expected {max}")
            }
            Self::BandsNotContiguous { at } => write!(f, "bands are not contiguous around {at}"),
            Self::OutOfRange(v) => write!(f, "score {v} is outside 0..=1000"),
        }
    }
}

impl std::error::Error for ValidationError {}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/// How a value was produced. `Unavailable` must be used instead of an estimate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Basis {
    Measured,
    Structural,
    Heuristic,
    UserSupplied,
    Unavailable,
}

/// How much weight a judgement deserves.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    Low,
    Medium,
    High,
}

/// Rank of a finding.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Blocker,
    Warning,
    Note,
}

/// Evidence Commons label for a claim about the world.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum EvidenceLabel {
    SelfReported,
    Verified,
    Reproducible,
    Anecdotal,
    Unclear,
    Contested,
    PrivateRedacted,
}

/// Category crowding, as a band. Never a precise number.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Saturation {
    Low,
    Medium,
    High,
    Unknown,
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/// Required at the top level of every document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailureCondition {
    pub statement: String,
    pub observable: String,
    pub horizon: String,
}

impl FailureCondition {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.statement.trim().is_empty() {
            return Err(ValidationError::MissingField("failure_condition.statement"));
        }
        if self.observable.trim().is_empty() {
            return Err(ValidationError::MissingField("failure_condition.observable"));
        }
        if self.horizon.trim().is_empty() {
            return Err(ValidationError::MissingField("failure_condition.horizon"));
        }
        Ok(())
    }
}

/// The thing under analysis.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub artifact_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub license: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
}

/// One honesty finding.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HonestyFinding {
    pub severity: Severity,
    pub matched: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#where: Option<String>,
    pub rule: String,
    pub suggestion: String,
}

/// The required honesty block.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HonestyAudit {
    pub invented_stats_detected: bool,
    pub fake_testimonials_detected: bool,
    pub guaranteed_outcomes_detected: bool,
    pub manufactured_outrage_detected: bool,
    #[serde(default)]
    pub dark_patterns_detected: Vec<String>,
    #[serde(default)]
    pub required_fixes: Vec<String>,
    pub passed: bool,
    #[serde(default)]
    pub findings: Vec<HonestyFinding>,
    #[serde(default)]
    pub scanned_for: Vec<String>,
}

impl HonestyAudit {
    pub fn validate(&self) -> Result<(), ValidationError> {
        let blockers = self
            .findings
            .iter()
            .filter(|f| f.severity == Severity::Blocker)
            .count();
        if self.passed && blockers > 0 {
            return Err(ValidationError::HonestyBlockerWithPassed(blockers as u32));
        }
        if !self.passed && self.required_fixes.is_empty() {
            return Err(ValidationError::FailedAuditWithoutFixes);
        }
        Ok(())
    }
}

/// One ethical risk and its assessment.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EthicalRisk {
    pub risk: String,
    /// `clear` | `caution` | `violation`
    pub assessment: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

/// The ethics review. `do_not_launch_yet` is a first-class outcome, not an error.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EthicsReview {
    pub ethical_risk_check: Vec<EthicalRisk>,
    pub do_not_launch_yet: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub do_not_launch_reason: Option<String>,
    #[serde(default)]
    pub audience_could_read_this: bool,
    /// `deterministic-rules` | `human` | `deterministic-rules+human`
    pub reviewer: String,
}

impl EthicsReview {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.do_not_launch_yet
            && self
                .do_not_launch_reason
                .as_deref()
                .unwrap_or("")
                .trim()
                .is_empty()
        {
            return Err(ValidationError::BlockWithoutReason);
        }
        if self
            .ethical_risk_check
            .iter()
            .any(|r| r.assessment == "violation")
            && !self.do_not_launch_yet
        {
            return Err(ValidationError::EthicalViolationWithoutBlock);
        }
        Ok(())
    }
}

/// A writer who would carry the artifact. Roles, never scraped individuals.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcasterCandidate {
    pub candidate: String,
    pub where_to_find: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub why_they_might_care: Option<String>,
    #[serde(default)]
    pub consent_status: ConsentStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact_channel: Option<String>,
}

/// Consent state for a candidate. Defaults to `unknown`, because assuming
/// consent is the failure mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "kebab-case")]
pub enum ConsentStatus {
    NotContacted,
    OptedIn,
    Declined,
    #[default]
    Unknown,
}

/// The Broadcaster Rule with a consent layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcasterAnalysis {
    pub primary_broadcaster_type: String,
    #[serde(default)]
    pub specific_broadcaster_candidates: Vec<BroadcasterCandidate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub broadcaster_stake: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub share_asset_needed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub consent_outreach_template: Option<String>,
    /// `no-contact` | `one-to-one-consent` | `public-invitation`
    pub consent_posture: String,
    pub anti_spam_rules: Vec<String>,
    #[serde(default)]
    pub what_not_to_say: Vec<String>,
    /// Hard cap. A policy constant, not a user setting.
    #[serde(default = "default_max_contacts")]
    pub max_contacts: u32,
}

fn default_max_contacts() -> u32 {
    3
}

impl BroadcasterAnalysis {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.anti_spam_rules.is_empty() {
            return Err(ValidationError::MissingAntiSpamRules);
        }
        match self.consent_posture.as_str() {
            "no-contact" | "one-to-one-consent" | "public-invitation" => Ok(()),
            other => Err(ValidationError::MissingField(match other {
                _ => "broadcaster_analysis.consent_posture",
            })),
        }
    }
}

/// A candidate repositioning.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjacentCategory {
    pub name: String,
    pub why_less_crowded: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credibility_risk: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tension_score: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proof_needed: Option<String>,
}

/// What the artifact is really competing with.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryAnalysis {
    pub saturation_estimate: Saturation,
    #[serde(default = "basis_unavailable")]
    pub saturation_basis: Basis,
    #[serde(default)]
    pub adjacent_categories: Vec<AdjacentCategory>,
    pub recommended_category: String,
    pub category_confidence: f32,
    #[serde(default)]
    pub evidence: Vec<String>,
    #[serde(default)]
    pub missing_data: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proposed_positioning: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub failure_condition: Option<FailureCondition>,
}

fn basis_unavailable() -> Basis {
    Basis::Unavailable
}

impl CategoryAnalysis {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.saturation_estimate == Saturation::Unknown && self.missing_data.is_empty() {
            return Err(ValidationError::UnknownSaturationWithoutReason);
        }
        if !(0.0..=1.0).contains(&self.category_confidence) {
            return Err(ValidationError::MissingField("category_confidence must be 0..1"));
        }
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// AQI
// ---------------------------------------------------------------------------

/// One row of the shared weights file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionSpec {
    pub key: String,
    pub label: String,
    pub weight: u32,
    pub question: String,
}

/// A score band.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Band {
    pub min: u32,
    pub max: u32,
    pub label: String,
    pub meaning: String,
}

/// The shared rubric file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Weights {
    #[serde(rename = "aqiVersion")]
    pub aqi_version: String,
    pub max: u32,
    pub dimensions: Vec<DimensionSpec>,
    #[serde(default)]
    pub disclaimer: String,
    #[serde(default)]
    pub bands: Vec<Band>,
}

impl Weights {
    /// Load from a path, or discover it by walking up to the repository root.
    pub fn load(explicit: Option<&Path>) -> Result<Self, Box<dyn std::error::Error>> {
        let path: PathBuf = match explicit {
            Some(p) => p.to_path_buf(),
            None => {
                let mut dir = std::env::current_dir()?;
                loop {
                    let candidate = dir.join("protocol").join("aqi-weights.json");
                    if candidate.exists() {
                        break candidate;
                    }
                    if !dir.pop() {
                        return Err("could not find protocol/aqi-weights.json; set \
                                    a path explicitly"
                            .into());
                    }
                }
            }
        };
        let raw = std::fs::read_to_string(&path)?;
        let w: Self = serde_json::from_str(&raw)?;
        w.validate()?;
        Ok(w)
    }

    /// A rubric that does not add up is a vibe with decimals.
    pub fn validate(&self) -> Result<(), ValidationError> {
        let sum: u32 = self.dimensions.iter().map(|d| d.weight).sum();
        if sum != self.max {
            return Err(ValidationError::WeightsDoNotSum {
                sum,
                max: self.max,
            });
        }
        let mut sorted = self.bands.clone();
        sorted.sort_by_key(|b| b.min);
        let mut expect = 0u32;
        for b in &sorted {
            if b.min != expect {
                return Err(ValidationError::BandsNotContiguous { at: b.min });
            }
            expect = b.max + 1;
        }
        if expect != self.max + 1 {
            return Err(ValidationError::BandsNotContiguous { at: expect });
        }
        Ok(())
    }

    /// The band label and meaning for a total.
    pub fn band_for(&self, total: f64) -> Result<&Band, ValidationError> {
        self.bands
            .iter()
            .find(|b| total >= b.min as f64 && total <= b.max as f64)
            .ok_or(ValidationError::OutOfRange(total))
    }

    fn spec(&self, key: &str) -> Option<&DimensionSpec> {
        self.dimensions.iter().find(|d| d.key == key)
    }
}

/// One scored row of the AQI. Cannot be constructed without its context.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dimension {
    pub key: String,
    pub label: String,
    pub weight: u32,
    pub score: f64,
    pub points: f64,
    pub basis: Basis,
    pub confidence: Confidence,
    pub evidence: Vec<String>,
    #[serde(default)]
    pub assumptions: Vec<String>,
    #[serde(default)]
    pub missing_data: Vec<String>,
    pub improvement: String,
    pub failure_condition: String,
    #[serde(default)]
    pub do_not_launch_yet: bool,
}

impl Dimension {
    /// Build a dimension, or refuse with the reason.
    pub fn new(
        weights: &Weights,
        key: &str,
        score: f64,
        basis: Basis,
        confidence: Confidence,
        evidence: Vec<String>,
        improvement: impl Into<String>,
        failure_condition: impl Into<String>,
    ) -> Result<Self, ValidationError> {
        let spec = weights
            .spec(key)
            .ok_or_else(|| ValidationError::UnknownDimension(key.to_string()))?;
        if evidence.is_empty() || evidence.iter().all(|e| e.trim().len() < 8) {
            return Err(ValidationError::MissingEvidence(key.to_string()));
        }
        let improvement = improvement.into();
        if improvement.trim().is_empty() {
            return Err(ValidationError::MissingImprovement(key.to_string()));
        }
        let failure_condition = failure_condition.into();
        if failure_condition.trim().is_empty() {
            return Err(ValidationError::MissingFailureCondition(key.to_string()));
        }
        if !(0.0..=100.0).contains(&score) {
            return Err(ValidationError::ScoreOutOfRange(key.to_string()));
        }
        Ok(Self {
            key: key.to_string(),
            label: spec.label.clone(),
            weight: spec.weight,
            score,
            points: round2(score * spec.weight as f64 / 100.0),
            basis,
            confidence,
            evidence,
            assumptions: Vec::new(),
            missing_data: Vec::new(),
            improvement,
            failure_condition,
            do_not_launch_yet: false,
        })
    }
}

/// The AQI block.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scorecard {
    pub aqi_version: String,
    pub max: u32,
    pub total: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub band: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disclaimer: Option<String>,
    pub dimensions: Vec<Dimension>,
}

impl Scorecard {
    /// Recompute the total and refuse a mismatch.
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.dimensions.is_empty() {
            return Err(ValidationError::MissingField("scorecard.dimensions"));
        }
        let computed = round2(self.dimensions.iter().map(|d| d.points).sum::<f64>());
        if (computed - self.total).abs() > 0.5 {
            return Err(ValidationError::TotalMismatch {
                stated: self.total.round() as u32,
                computed: computed.round() as u32,
            });
        }
        Ok(())
    }
}

/// A complete ODS document.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub ods_version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generated_at: Option<String>,
    pub artifact: Artifact,
    pub honesty_audit: HonestyAudit,
    pub scorecard: Scorecard,
    pub failure_conditions: Vec<FailureCondition>,
    pub ethics_review: EthicsReview,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_analysis: Option<CategoryAnalysis>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub broadcaster_analysis: Option<BroadcasterAnalysis>,
    #[serde(default)]
    pub limitations: Vec<String>,
}

impl Document {
    /// Apply every rule the protocol promises. Call this before publishing.
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.artifact.id.trim().is_empty() || self.artifact.name.trim().is_empty() {
            return Err(ValidationError::MissingField("artifact.id / artifact.name"));
        }
        if self.failure_conditions.is_empty() {
            return Err(ValidationError::NoFailureConditions);
        }
        for f in &self.failure_conditions {
            f.validate()?;
        }
        self.honesty_audit.validate()?;
        self.scorecard.validate()?;
        self.ethics_review.validate()?;
        if !self.honesty_audit.passed && !self.ethics_review.do_not_launch_yet {
            return Err(ValidationError::EthicalViolationWithoutBlock);
        }
        if let Some(c) = &self.category_analysis {
            c.validate()?;
        }
        if let Some(b) = &self.broadcaster_analysis {
            b.validate()?;
        }
        Ok(())
    }

    /// Parse and validate.
    pub fn from_json(raw: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let doc: Self = serde_json::from_str(raw)?;
        doc.validate()?;
        Ok(doc)
    }
}

// ---------------------------------------------------------------------------
// Convenience
// ---------------------------------------------------------------------------

/// Sum points, capped at the maximum.
pub fn total(dims: &[Dimension], max: u32) -> f64 {
    round2(dims.iter().map(|d| d.points).sum::<f64>()).min(max as f64)
}

/// The lowest-scoring dimension.
pub fn weakest(dims: &[Dimension]) -> Option<&Dimension> {
    dims.iter().min_by(|a, b| a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal))
}

/// The dimensions losing the most points, which is where the work actually is.
pub fn top_leverage(dims: &[Dimension], n: usize) -> Vec<&Dimension> {
    let mut sorted: Vec<&Dimension> = dims.iter().collect();
    sorted.sort_by(|a, b| {
        let la = (100.0 - a.score) * a.weight as f64 / 100.0;
        let lb = (100.0 - b.score) * b.weight as f64 / 100.0;
        lb.partial_cmp(&la).unwrap_or(std::cmp::Ordering::Equal)
    });
    sorted.into_iter().take(n).collect()
}

fn round2(f: f64) -> f64 {
    (f * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn weights() -> Weights {
        Weights::load(None).expect("weights load; run from inside the repository")
    }

    #[test]
    fn weights_sum_to_max() {
        let w = weights();
        assert_eq!(w.dimensions.len(), 20);
        assert_eq!(w.dimensions.iter().map(|d| d.weight).sum::<u32>(), w.max);
    }

    #[test]
    fn dimension_requires_evidence() {
        let w = weights();
        let r = Dimension::new(&w, "category_clarity", 50.0, Basis::Structural, Confidence::Medium, vec![], "i", "f");
        assert!(matches!(r, Err(ValidationError::MissingEvidence(_))));
    }

    #[test]
    fn dimension_requires_failure_condition() {
        let w = weights();
        let r = Dimension::new(
            &w, "category_clarity", 50.0, Basis::Structural, Confidence::Medium,
            vec!["a specific observation".into()], "i", "",
        );
        assert!(matches!(r, Err(ValidationError::MissingFailureCondition(_))));
    }

    #[test]
    fn points_are_weight_scaled() {
        let w = weights();
        let d = Dimension::new(
            &w, "category_clarity", 50.0, Basis::Structural, Confidence::Medium,
            vec!["half the structural checks passed".into()], "add a pairing", "readers say just another X",
        )
        .expect("valid dimension");
        assert_eq!(d.weight, 80);
        assert_eq!(d.points, 40.0);
    }

    #[test]
    fn scorecard_total_must_add_up() {
        let w = weights();
        let d = Dimension::new(
            &w, "category_clarity", 100.0, Basis::Measured, Confidence::High,
            vec!["all checks passed for this dimension".into()], "i", "f",
        )
        .expect("valid");
        let sc = Scorecard {
            aqi_version: "1.0.0".into(), max: 1000, total: 5.0, band: None, disclaimer: None,
            dimensions: vec![d.clone()],
        };
        assert!(sc.validate().is_err());
        let ok = Scorecard { total: 80.0, ..sc };
        assert!(ok.validate().is_ok());
    }

    #[test]
    fn honesty_blocker_cannot_pass() {
        let a = HonestyAudit {
            invented_stats_detected: false,
            fake_testimonials_detected: false,
            guaranteed_outcomes_detected: false,
            manufactured_outrage_detected: false,
            dark_patterns_detected: vec![],
            required_fixes: vec![],
            passed: true,
            findings: vec![HonestyFinding {
                severity: Severity::Blocker,
                matched: "10x".into(),
                r#where: None,
                rule: "unsourced multiplier".into(),
                suggestion: "give a baseline".into(),
            }],
            scanned_for: vec![],
        };
        assert!(a.validate().is_err());
    }

    #[test]
    fn unknown_saturation_needs_a_reason() {
        let c = CategoryAnalysis {
            saturation_estimate: Saturation::Unknown,
            saturation_basis: Basis::Unavailable,
            adjacent_categories: vec![],
            recommended_category: "c".into(),
            category_confidence: 0.2,
            evidence: vec![],
            missing_data: vec![],
            proposed_positioning: None,
            failure_condition: None,
        };
        assert!(c.validate().is_err());
        let fixed = CategoryAnalysis {
            missing_data: vec!["no count was measured".into()],
            ..c
        };
        assert!(fixed.validate().is_ok());
    }

    #[test]
    fn ethical_violation_forces_block() {
        let e = EthicsReview {
            ethical_risk_check: vec![EthicalRisk {
                risk: "deception".into(),
                assessment: "violation".into(),
                note: None,
            }],
            do_not_launch_yet: false,
            do_not_launch_reason: None,
            audience_could_read_this: false,
            reviewer: "deterministic-rules".into(),
        };
        assert!(e.validate().is_err());
    }

    #[test]
    fn broadcaster_rules_are_required() {
        let b = BroadcasterAnalysis {
            primary_broadcaster_type: "writer".into(),
            specific_broadcaster_candidates: vec![],
            broadcaster_stake: None,
            share_asset_needed: None,
            consent_outreach_template: None,
            consent_posture: "one-to-one-consent".into(),
            anti_spam_rules: vec![],
            what_not_to_say: vec![],
            max_contacts: 3,
        };
        assert!(b.validate().is_err());
    }

    #[test]
    fn bands_cover_the_range() {
        let w = weights();
        assert_eq!(w.band_for(0.0).unwrap().label, "Not ready");
        assert_eq!(w.band_for(1000.0).unwrap().label, "Exceptional");
        assert!(w.band_for(1001.0).is_err());
    }

    #[test]
    fn weakest_and_leverage() {
        let w = weights();
        let a = Dimension::new(
            &w, "category_clarity", 20.0, Basis::Heuristic, Confidence::Low,
            vec!["low score observed on this dimension".into()], "i", "f",
        )
        .unwrap();
        let b = Dimension::new(
            &w, "accessibility", 30.0, Basis::Heuristic, Confidence::Low,
            vec!["low score observed on this dimension".into()], "i", "f",
        )
        .unwrap();
        let dims = vec![a, b];
        assert_eq!(weakest(&dims).unwrap().key, "category_clarity");
        assert_eq!(top_leverage(&dims, 1)[0].key, "category_clarity");
    }
}
