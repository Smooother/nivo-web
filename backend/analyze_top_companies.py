import os
import openai
import pandas as pd
from sqlalchemy import create_engine, inspect
import time
import json
from datetime import datetime

# Create output directories if they don't exist
os.makedirs('outputs/reports', exist_ok=True)
os.makedirs('outputs/analysis', exist_ok=True)

# === CONFIG ===
DB_PATH = "allabolag.db"
INPUT_PREFIX = "filtered_companies_v"
FIT_TABLE = "website_fit_scores"
ANALYSIS_TABLE = "ai_company_analysis"
EXCEL_OUT = "ai_company_analysis.xlsx"
N_TOP = 50

openai.api_key = os.getenv("OPENAI_API_KEY")  # Or set here: 'sk-...'

def get_latest_input_table(engine):
    versioned_tables = pd.read_sql(
        f"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '{INPUT_PREFIX}%' ORDER BY name DESC LIMIT 1",
        engine
    )
    if versioned_tables.empty:
        raise Exception("No versioned company tables found.")
    return versioned_tables['name'].iloc[0]

def load_company_data(engine, input_table):
    df = pd.read_sql(f"SELECT * FROM {input_table}", engine)
    # Optional: join with website fit score table
    inspector = inspect(engine)
    fit_scores = None
    if FIT_TABLE in inspector.get_table_names():
        fit_scores = pd.read_sql(f"SELECT * FROM {FIT_TABLE}", engine)
        # Merge on OrgNr/orgnr
        fit_scores = fit_scores.rename(columns={'OrgNr': 'OrgNr', 'orgnr': 'OrgNr'})
        df = df.merge(fit_scores[['OrgNr', 'fit_score_reason']], on="OrgNr", how="left")
    return df

def ai_analyze_company(company_info):
    context = f"""
You are an expert Swedish SME investor. Given this company's recent financial data and website fit score, decide how attractive this company is as a potential takeover/scale-up target (1=poor, 5=perfect).
Output a JSON with: score (1-5), reason (max 3 sentences), and risk_factors (max 2).

Company data:
{company_info}
"""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": context}],
            max_tokens=400,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("AI error:", e)
        return '{"score": null, "reason": "AI error", "risk_factors": ""}'

def main():
    engine = create_engine(f"sqlite:///{DB_PATH}")
    input_table = get_latest_input_table(engine)
    print("Analyzing companies from:", input_table)
    df = load_company_data(engine, input_table)
    print(f"Loaded {len(df)} companies.")

    results = []
    for idx, row in df.iterrows():
        orgnr = row.get('OrgNr') or row.get('orgnr')
        print(f"Analyzing {orgnr} ({idx+1}/{len(df)})...")
        # Build concise company info for AI
        company_info = {
            k: (str(v)[:256] if not pd.isnull(v) else "") for k, v in row.items() if k.lower() not in ["index"]
        }
        company_info_str = json.dumps(company_info, ensure_ascii=False)
        ai_json = ai_analyze_company(company_info_str)

        # Parse AI result
        try:
            ai_data = json.loads(ai_json)
        except Exception:
            ai_data = {"score": None, "reason": ai_json, "risk_factors": ""}

        # Convert risk_factors list to string if it exists
        risk_factors = ai_data.get("risk_factors", "")
        if isinstance(risk_factors, list):
            risk_factors = "; ".join(risk_factors)

        results.append({
            **company_info,
            "ai_score": ai_data.get("score"),
            "ai_reason": ai_data.get("reason"),
            "ai_risk_factors": risk_factors,
        })
        time.sleep(1.3)  # throttle for OpenAI and cost control

    # Save all to DB and Excel
    df_out = pd.DataFrame(results)
    
    # Save to CSV first
    csv_filename = f'outputs/analysis/ai_company_analysis_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.csv'
    df_out.to_csv(csv_filename, index=False)
    print(f"Saved results to CSV file: {csv_filename}")

    try:
        df_out.to_sql(ANALYSIS_TABLE, engine, if_exists="replace", index=False)
        print(f"Saved results to DB table {ANALYSIS_TABLE}.")
    except Exception as e:
        print(f"Error saving to database: {str(e)}")
        print("Results are still saved in the CSV file.")

    # Top N to Excel
    if "ai_score" in df_out.columns:
        df_out["ai_score"] = pd.to_numeric(df_out["ai_score"], errors="coerce")
        df_out = df_out.sort_values(by="ai_score", ascending=False)
    excel_out = f'outputs/reports/ai_company_analysis_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    df_out.head(N_TOP).to_excel(excel_out, index=False)
    print(f"Top {N_TOP} results saved to {excel_out}.")

if __name__ == "__main__":
    main()