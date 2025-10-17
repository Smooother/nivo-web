"""Entry point for the agentic targeting pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from agentic_pipeline.ai_analysis import (
    AIAnalysisConfig,
    AgenticLLMAnalyzer,
    SupabaseAnalysisWriter,
)
from agentic_pipeline.config import PipelineConfig
from agentic_pipeline.orchestrator import AgenticTargetingPipeline


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the agentic targeting pipeline")
    parser.add_argument("--db-path", type=Path, default=Path("allabolag.db"), help="Path to the SQLite database")
    parser.add_argument("--top", type=int, default=30, help="Number of companies to shortlist")
    parser.add_argument("--no-db", action="store_true", help="Skip writing results back to the database")
    parser.add_argument("--no-csv", action="store_true", help="Skip writing CSV outputs")
    parser.add_argument("--no-excel", action="store_true", help="Skip writing Excel outputs")
    parser.add_argument(
        "--ai-analysis",
        action="store_true",
        help="Run LLM-based analysis on the shortlisted companies",
    )
    parser.add_argument(
        "--ai-limit",
        type=int,
        default=10,
        help="Number of shortlisted companies to send to the LLM (default: 10)",
    )
    parser.add_argument(
        "--ai-model",
        type=str,
        default="gpt-4.1-mini",
        help="OpenAI model identifier for AI analysis",
    )
    parser.add_argument(
        "--ai-no-supabase",
        action="store_true",
        help="Skip persisting AI analysis results to Supabase",
    )
    parser.add_argument(
        "--ai-table",
        type=str,
        default="ai_company_analysis",
        help="Supabase table for storing AI analysis results",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = PipelineConfig(
        db_path=args.db_path,
        n_top_companies=args.top,
        write_to_db=not args.no_db,
        write_to_csv=not args.no_csv,
        write_to_excel=not args.no_excel,
    )
    pipeline = AgenticTargetingPipeline(config)
    artifacts = pipeline.run()

    issues = [
        {"level": issue.level, "message": issue.message}
        for issue in artifacts.quality_issues
    ]
    output_payload = {"quality_issues": issues, "shortlist_size": len(artifacts.shortlist)}

    if args.ai_analysis:
        ai_config = AIAnalysisConfig(model=args.ai_model, supabase_table=args.ai_table)
        supabase_writer = None
        if not args.ai_no_supabase:
            try:
                supabase_writer = SupabaseAnalysisWriter(
                    table=ai_config.supabase_table,
                    conflict_column=ai_config.supabase_conflict_column,
                )
            except ValueError as exc:
                print(f"⚠️  Supabase writer disabled: {exc}")

        analyzer = AgenticLLMAnalyzer(ai_config, supabase_writer=supabase_writer)
        batch = analyzer.run(artifacts.shortlist, limit=args.ai_limit)
        output_payload["ai_run_id"] = batch.run.id
        output_payload["ai_analysis_rows"] = len(batch.companies)
        output_payload["ai_errors"] = batch.errors
        company_df = batch.company_dataframe()
        output_payload["ai_output_columns"] = list(company_df.columns)

    print(json.dumps(output_payload, indent=2))


if __name__ == "__main__":
    main()
