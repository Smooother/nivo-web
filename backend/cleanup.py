import os
import shutil
from datetime import datetime

# Define directories
OUTPUTS_DIR = 'outputs'
REPORTS_DIR = os.path.join(OUTPUTS_DIR, 'reports')
ANALYSIS_DIR = os.path.join(OUTPUTS_DIR, 'analysis')
FILTERED_DIR = os.path.join(OUTPUTS_DIR, 'filtered')
RAW_DIR = os.path.join(OUTPUTS_DIR, 'raw')

# Create directories if they don't exist
for directory in [OUTPUTS_DIR, REPORTS_DIR, ANALYSIS_DIR, FILTERED_DIR, RAW_DIR]:
    os.makedirs(directory, exist_ok=True)

# Files to move to reports directory
report_files = [
    'filtered_companies_*.xlsx',
    'ai_company_analysis*.xlsx',
    'ai_company_analysis*.csv',
    'filtering_process_*.csv'
]

# Files to move to analysis directory
analysis_files = [
    'companyoutput.json',
    'all_categories.csv',
    'all_categories.json'
]

# Files to move to filtered directory
filtered_files = [
    'filtered_companies.xlsx'
]

# Files to move to raw directory
raw_files = [
    'failed_requests.txt',
    'fetch.log'
]

# Scripts to remove
scripts_to_remove = [
    'filter_companies.py',
    'filter_service_businesses.py',
    'filter_service_businesses_inmemory.py',
    'filter_metall_verkstad.py',
    'filter_by_rating.py',
    'filter_sectors.py',
    'list_sectors.py',
    'add_companyid.py',
    'fill_missing_companyids.py',
    'json_to_csv.py'
]

def move_files(pattern_list, target_dir):
    """Move files matching patterns to target directory"""
    import glob
    for pattern in pattern_list:
        for file in glob.glob(pattern):
            if os.path.exists(file):
                target_path = os.path.join(target_dir, file)
                print(f"Moving {file} to {target_path}")
                shutil.move(file, target_path)

def remove_scripts(script_list):
    """Remove unused scripts"""
    for script in script_list:
        if os.path.exists(script):
            print(f"Removing {script}")
            os.remove(script)

def main():
    print("Starting cleanup process...")
    
    # Move files to appropriate directories
    print("\nMoving report files...")
    move_files(report_files, REPORTS_DIR)
    
    print("\nMoving analysis files...")
    move_files(analysis_files, ANALYSIS_DIR)
    
    print("\nMoving filtered files...")
    move_files(filtered_files, FILTERED_DIR)
    
    print("\nMoving raw files...")
    move_files(raw_files, RAW_DIR)
    
    # Remove unused scripts
    print("\nRemoving unused scripts...")
    remove_scripts(scripts_to_remove)
    
    print("\nCleanup completed!")

if __name__ == "__main__":
    main() 