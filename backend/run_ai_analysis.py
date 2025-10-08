"""Standalone CLI to run AI company analysis outside of the full pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from agentic_pipeline import AIAnalysisConfig, AgenticLLMAnalyzer, SupabaseAnalysisWriter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run AI analysis for a shortlist of companies")
    parser.add_argument("input", type=Path, help="CSV file containing shortlist data")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows analysed")
    parser.add_argument("--model", type=str, default="gpt-4.1-mini", help="OpenAI model identifier")
    parser.add_argument(
        "--write-supabase",
        action="store_true",
        help="Persist results to Supabase using configured credentials",
    )
    parser.add_argument("--initiated-by", type=str, default=None, help="Identifier of the triggering user")
    parser.add_argument("--filters", type=str, default=None, help="JSON string describing shortlist filters")
    return parser.parse_args()


def load_shortlist(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Shortlist file not found: {path}")
    return pd.read_csv(path)


def main() -> None:
    args = parse_args()
    shortlist = load_shortlist(args.input)

    config = AIAnalysisConfig(model=args.model)
    writer = None
    if args.write_supabase:
        writer = SupabaseAnalysisWriter(config=config)

    filters = json.loads(args.filters) if args.filters else None
    analyzer = AgenticLLMAnalyzer(config, supabase_writer=writer)
    batch = analyzer.run(
        shortlist,
        limit=args.limit,
        initiated_by=args.initiated_by,
        filters=filters,
    )

    company_df = batch.company_dataframe()
    print(
        json.dumps(
            {
                "run_id": batch.run.id,
                "rows": len(batch.companies),
                "errors": batch.errors,
                "columns": list(company_df.columns),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

