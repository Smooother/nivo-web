# AI Search & Reporting Overview

This document summarizes how the agentic targeting pipeline discovers promising companies and how the two-stage AI analysis layer persists and surfaces results.

## 1. Agentic Targeting "Search" Pipeline

### 1.1 Data ingestion & preparation
- `TargetingDataLoader` validates that the `company_kpis`, `company_accounts`, and `companies_enriched` tables exist in the local SQLite mirror before returning a merged DataFrame of the latest yearly records for each organisation number, recording structured `QualityIssue` diagnostics whenever prerequisites are missing.【F:backend/agentic_pipeline/data_access.py†L12-L79】
- `FeatureEngineer` normalizes column names, derives ratios such as revenue per employee, EBIT per employee, and equity ratio, and reports summary statistics for every numeric feature that will drive clustering and ranking.【F:backend/agentic_pipeline/features.py†L12-L84】
- `DataQualityChecker` records critical and warning-level issues whenever engineered features are missing or sparsely populated, ensuring the shortlist is accompanied by diagnostic messages.【F:backend/agentic_pipeline/quality.py†L11-L48】

### 1.2 Segmentation & scoring
- `Segmenter` scales engineered features and runs K-Means clustering (default: 6 clusters) to assign each company to a segment while retaining the inverse-transformed cluster centroids for reporting.【F:backend/agentic_pipeline/segmentation.py†L1-L48】
- `CompositeRanker` normalizes growth, profitability, efficiency, risk, and data quality signals, applies configurable weights, and produces a composite score plus per-dimension components.【F:backend/agentic_pipeline/ranking.py†L1-L47】

### 1.3 Deterministic narrative context
- `MarketFinancialAnalyzer` translates revenue, growth, margin, and equity signals into short market, financial, and risk summaries. These engineered narratives become additional context columns on the dataset and flow into later AI prompts.【F:backend/agentic_pipeline/analysis.py†L1-L103】

### 1.4 Orchestration & persistence
- `AgenticTargetingPipeline.run()` stitches the steps together: load data, engineer features, check quality, segment, rank, append deterministic summaries, sort by composite score, and produce a shortlist of the top `n_top_companies` (default 30).【F:backend/agentic_pipeline/orchestrator.py†L31-L75】
- When configured, the pipeline writes CSV/Excel exports, persists shortlist tables, and stores segment centroids through `_persist`, enabling downstream reporting and reproducibility.【F:backend/agentic_pipeline/orchestrator.py†L78-L92】

### 1.5 File-system outputs
- The repository ships historical exports in `outputs/`, including filtered company spreadsheets and generated reports, illustrating how shortlist artefacts can be shared externally.【df4e54†L1-L3】【744769†L1-L1】

## 2. Two-Stage AI Analysis & Reporting

### 2.1 Screening mode (Stage 1)
- `SCREENING_SYSTEM_PROMPT`, `get_screening_prompt()`, and `get_batch_screening_prompt()` enforce a concise Swedish-language rubric that returns a 1–100 score, Low/Medium/High risk flag, and 2–3 sentence summary for each company or batch.【F:backend/agentic_pipeline/screening_prompt.py†L1-L90】
- The API layer routes screening requests to the OpenAI `gpt-4o-mini` model, capturing per-company audit metadata (prompt, latency, token counts, cost) for traceability.【F:api/ai-analysis.ts†L430-L598】
- Screening results are persisted in `ai_ops.ai_screening_results`, keyed by run ID and organisation number, enabling quick retrieval and dashboard sorting.【F:database/ai_ops_schema.sql†L115-L131】

### 2.2 Deep analysis mode (Stage 2)
- `AgenticLLMAnalyzer` (within `ai_analysis.py`) defines JSON schemas for detailed analyses, orchestrates context assembly, selects models, and differentiates between screening and deep-analysis workflows.【F:backend/agentic_pipeline/ai_analysis.py†L598-L702】
- When performing deep analysis, the service enriches each company with asynchronous website scraping, news searches, and industry context so that narrative outputs are grounded in external signals before hitting the LLM.【F:backend/agentic_pipeline/web_enrichment.py†L1-L240】
- The API endpoint stores run metadata, section narratives, metrics, and audit logs across `ai_ops.ai_analysis_runs`, `ai_ops.ai_company_analysis`, `ai_ops.ai_analysis_sections`, `ai_ops.ai_analysis_metrics`, and `ai_ops.ai_analysis_audit`, providing a fully auditable paper trail.【F:database/ai_ops_schema.sql†L1-L110】

### 2.3 Frontend reporting & operator workflow
- The React workflow walks operators through selecting a saved list, choosing screening or deep analysis, toggling companies, configuring instructions, estimating cost, and launching the run from the UI.【F:frontend/src/components/AIAnalysis.tsx†L718-L819】
- Screening cards list score, risk, and summary, support selection for deep analysis, and preserve audit data for each result.【F:frontend/src/components/AIAnalysis.tsx†L720-L755】
- Deep-analysis results render narrative sections, metrics, and recommendations in expandable sections for each company, giving operators rich narrative context alongside structured grades.【F:frontend/src/components/AIAnalysis.tsx†L270-L358】

### 2.4 Output destinations
- Spreadsheet exports and Supabase tables make the shortlist portable for commercial teams, while AI run tables back the on-platform history view and any downstream BI dashboards. This dual persistence supports both quick sharing and governed analytics pipelines.【F:backend/agentic_pipeline/orchestrator.py†L78-L92】【F:database/ai_ops_schema.sql†L1-L170】

## 3. Key Takeaways
- **Search**: deterministic segmentation + ranking narrows the universe before any tokens are spent.
- **Screening**: low-cost rubric scores batches quickly and stores them for triage.
- **Deep analysis**: enriched context feeds structured JSON outputs with full audit trails.
- **Reporting**: CSV/Excel artefacts, Supabase tables, and the React UI surface insights to operators and downstream systems alike.
