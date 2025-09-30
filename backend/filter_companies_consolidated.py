import pandas as pd
from sqlalchemy import create_engine
import datetime
import os
import json
from typing import List, Dict, Any

class CompanyFilter:
    def __init__(self, config_path: str = 'filter_config.json'):
        self.engine = create_engine('sqlite:///allabolag.db')
        self.config = self._load_config(config_path)
        self.timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create output directories if they don't exist
        os.makedirs('outputs/filtered', exist_ok=True)
        os.makedirs('outputs/analysis', exist_ok=True)
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load filtering configuration from JSON file"""
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        else:
            # Default configuration
            return {
                "financial_criteria": {
                    "revenue_min": 10000,
                    "revenue_max": 150000,
                    "profit_min": 500,
                    "profit_max": 15000,
                    "min_employees": 2,
                    "max_employees": 50
                },
                "growth_criteria": {
                    "min_revenue_growth": 0.05,
                    "min_profit_growth": 0.05,
                    "years_to_check": [2023, 2022, 2021]
                },
                "excluded_sectors": [
                    "Apoteksvaror, läkemedel - Partihandel",
                    "Gummivaror",
                    "Plåtslagerier",
                    # ... (add more sectors from filter_candidates.py)
                ],
                "included_sectors": [
                    "IT-konsulter",
                    "Programvaruutveckling",
                    "Teknisk konsultation",
                    # ... (add more sectors)
                ],
                "website_criteria": {
                    "min_fit_score": 3,
                    "required_keywords": ["kontakt", "om oss", "tjänster"]
                }
            }

    def _save_filtered_data(self, df: pd.DataFrame, step_name: str) -> str:
        """Save filtered data to both database and CSV"""
        # Drop duplicate columns if present
        for col in ['revenue', 'profit']:
            if col in df.columns and df.columns.tolist().count(col) > 1:
                # Only keep the last occurrence
                cols = df.columns.tolist()
                first = cols.index(col)
                df = df.drop(df.columns[first], axis=1)
        # Save to database
        table_name = f'filtered_companies_{step_name}_{self.timestamp}'
        df.to_sql(table_name, self.engine, if_exists='replace', index=False)
        # Save to CSV
        csv_path = f'outputs/filtered/{step_name}_{self.timestamp}.csv'
        df.to_csv(csv_path, index=False)
        return table_name

    def apply_basic_filters(self) -> pd.DataFrame:
        """Apply initial financial and sector filters"""
        # First get the latest financial data for each company
        query = """
        WITH latest_financials AS (
            SELECT 
                OrgNr,
                MAX(year) as latest_year
            FROM company_accounts
            GROUP BY OrgNr
        )
        SELECT 
            c.*,
            ca.TR as revenue,
            ca.DR as profit
        FROM companies c
        JOIN latest_financials lf ON c.OrgNr = lf.OrgNr
        JOIN company_accounts ca ON c.OrgNr = ca.OrgNr AND ca.year = lf.latest_year
        WHERE ca.TR BETWEEN :rev_min AND :rev_max
        AND ca.DR BETWEEN :prof_min AND :prof_max
        """
        
        df = pd.read_sql(
            query, 
            self.engine,
            params={
                'rev_min': self.config['financial_criteria']['revenue_min'],
                'rev_max': self.config['financial_criteria']['revenue_max'],
                'prof_min': self.config['financial_criteria']['profit_min'],
                'prof_max': self.config['financial_criteria']['profit_max']
            }
        )
        
        # Filter out excluded sectors
        df = df[~df['segment_name'].isin(self.config['excluded_sectors'])]
        
        # Filter for included sectors if specified
        if self.config['included_sectors']:
            df = df[df['segment_name'].isin(self.config['included_sectors'])]
        
        print(f"[DEBUG] Number of companies after basic filter: {len(df)}")
        return df

    def apply_growth_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply growth and stability filters using each company's latest 3 years"""
        # Get all financials for companies in df
        orgnrs = tuple(df['OrgNr'])
        query = f"""
        SELECT 
            OrgNr, 
            year, 
            TR as revenue, 
            DR as profit 
        FROM company_accounts 
        WHERE OrgNr IN {orgnrs}
        """
        financials = pd.read_sql(query, self.engine)
        
        # Calculate growth metrics for each company using its latest 3 years
        growth_metrics = []
        count_3y = 0
        for orgnr in df['OrgNr']:
            company_fin = financials[financials['OrgNr'] == orgnr].sort_values('year', ascending=False)
            years = company_fin['year'].unique()
            if len(years) >= 3:
                count_3y += 1
                last3 = company_fin.head(3).sort_values('year')
                revenue_growth = last3['revenue'].pct_change().mean()
                profit_growth = last3['profit'].pct_change().mean()
                growth_metrics.append({
                    'OrgNr': orgnr,
                    'revenue_growth': revenue_growth,
                    'profit_growth': profit_growth
                })
        print(f"[DEBUG] Companies with at least 3 years of data: {count_3y}")
        growth_df = pd.DataFrame(growth_metrics)
        print("[DEBUG] Shape of growth_df:", growth_df.shape)
        print("[DEBUG] Columns in growth_df:", growth_df.columns.tolist())
        print("[DEBUG] Sample growth_df:", growth_df.head())
        
        df = df.merge(growth_df, on='OrgNr', how='inner')
        
        # Apply growth filters
        df = df[
            (df['revenue_growth'] >= self.config['growth_criteria']['min_revenue_growth']) &
            (df['profit_growth'] >= self.config['growth_criteria']['min_profit_growth'])
        ]
        
        return df

    def apply_website_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply website and digital presence filters"""
        # Get website data
        query = """
        SELECT OrgNr, homepage, fit_score, fit_score_reason
        FROM website_fit_scores
        """
        website_data = pd.read_sql(query, self.engine)
        
        # Merge with main dataframe
        df = df.merge(website_data, on='OrgNr', how='inner')
        
        # Apply website filters
        df = df[df['fit_score'] >= self.config['website_criteria']['min_fit_score']]
        
        return df

    def run_filtering_pipeline(self) -> Dict[str, Any]:
        """Run the complete filtering pipeline"""
        results = {}
        
        # Step 1: Basic filters
        print("Applying basic filters...")
        df_basic = self.apply_basic_filters()
        results['basic_filters'] = {
            'count': len(df_basic),
            'table_name': self._save_filtered_data(df_basic, 'basic_filters')
        }
        
        # Step 2: Growth filters
        print("Applying growth filters...")
        df_growth = self.apply_growth_filters(df_basic)
        results['growth_filters'] = {
            'count': len(df_growth),
            'table_name': self._save_filtered_data(df_growth, 'growth_filters')
        }
        
        # Step 3: Website filters
        print("Applying website filters...")
        df_final = self.apply_website_filters(df_growth)
        results['final_filters'] = {
            'count': len(df_final),
            'table_name': self._save_filtered_data(df_final, 'final_filters')
        }
        
        # Save summary
        self._save_summary(results)
        
        return results

    def _save_summary(self, results: Dict[str, Any]):
        """Save filtering summary to JSON"""
        summary = {
            'timestamp': self.timestamp,
            'steps': results,
            'config': self.config
        }
        
        with open(f'outputs/analysis/filtering_summary_{self.timestamp}.json', 'w') as f:
            json.dump(summary, f, indent=2)

def main():
    # Create filter instance
    filter = CompanyFilter()
    
    # Run filtering pipeline
    results = filter.run_filtering_pipeline()
    
    # Print summary
    print("\nFiltering Results Summary:")
    print("=" * 50)
    for step, data in results.items():
        print(f"\n{step}:")
        print(f"Companies remaining: {data['count']}")
        print(f"Saved to table: {data['table_name']}")

if __name__ == "__main__":
    main() 