import pandas as pd
from sqlalchemy import create_engine
import datetime
import os
import json
from typing import Dict, Any

def load_filtering_summaries() -> pd.DataFrame:
    """Load all filtering summaries from the analysis directory"""
    summaries = []
    analysis_dir = 'outputs/analysis'
    
    if not os.path.exists(analysis_dir):
        return pd.DataFrame()
    
    for file in os.listdir(analysis_dir):
        if file.startswith('filtering_summary_') and file.endswith('.json'):
            with open(os.path.join(analysis_dir, file), 'r') as f:
                summary = json.load(f)
                summaries.append({
                    'timestamp': summary['timestamp'],
                    'basic_filters_count': summary['steps']['basic_filters']['count'],
                    'growth_filters_count': summary['steps']['growth_filters']['count'],
                    'final_filters_count': summary['steps']['final_filters']['count'],
                    'config': summary['config']
                })
    
    return pd.DataFrame(summaries)

def export_filtering_process():
    """Export the filtering process to CSV"""
    # Load summaries
    df = load_filtering_summaries()
    
    if df.empty:
        print("No filtering summaries found.")
        return
    
    # Sort by timestamp
    df = df.sort_values('timestamp', ascending=False)
    
    # Calculate percentages and differences
    df['basic_filters_percentage'] = (df['basic_filters_count'] / df['basic_filters_count'].iloc[0] * 100).round(2)
    df['growth_filters_percentage'] = (df['growth_filters_count'] / df['basic_filters_count'].iloc[0] * 100).round(2)
    df['final_filters_percentage'] = (df['final_filters_count'] / df['basic_filters_count'].iloc[0] * 100).round(2)
    
    df['basic_filters_removed'] = df['basic_filters_count'].diff().abs()
    df['growth_filters_removed'] = (df['basic_filters_count'] - df['growth_filters_count'])
    df['final_filters_removed'] = (df['growth_filters_count'] - df['final_filters_count'])
    
    # Format the output
    output_columns = [
        'timestamp',
        'basic_filters_count',
        'basic_filters_percentage',
        'basic_filters_removed',
        'growth_filters_count',
        'growth_filters_percentage',
        'growth_filters_removed',
        'final_filters_count',
        'final_filters_percentage',
        'final_filters_removed'
    ]
    
    # Save to CSV
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'outputs/reports/filtering_process_{timestamp}.csv'
    df[output_columns].to_csv(filename, index=False)
    
    # Print summary
    print(f"\nFiltering Process Summary (Latest Run):")
    print("=" * 80)
    latest = df.iloc[0]
    print(f"\nInitial Companies: {latest['basic_filters_count']}")
    print(f"After Growth Filters: {latest['growth_filters_count']} ({latest['growth_filters_percentage']}%)")
    print(f"Final Companies: {latest['final_filters_count']} ({latest['final_filters_percentage']}%)")
    print(f"\nFull report saved to: {filename}")

if __name__ == "__main__":
    export_filtering_process() 