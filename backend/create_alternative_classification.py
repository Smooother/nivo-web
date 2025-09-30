#!/usr/bin/env python3
"""
Create alternative industry classification based on company names and other data
instead of relying on allabolag.se's mysterious industry codes
"""

import sqlite3
from pathlib import Path
import re
from collections import Counter

def create_name_based_classification():
    """
    Create industry classification based on company names
    """
    db_path = Path(__file__).parent.parent / "allabolag.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🏷️  CREATING NAME-BASED INDUSTRY CLASSIFICATION")
    print("=" * 55)
    
    # Define industry keywords and their categories
    industry_patterns = {
        'Technology & IT': [
            'IT', 'Tech', 'Software', 'Digital', 'Computer', 'System', 'Data', 'App', 'Web', 'Online',
            'Cyber', 'Cloud', 'AI', 'Blockchain', 'Mobile', 'Platform', 'Solution', 'Development',
            'Programming', 'Code', 'Network', 'Server', 'Database', 'API', 'Integration'
        ],
        'Manufacturing & Production': [
            'Produktion', 'Manufacturing', 'Fabrik', 'Industri', 'Tillverkning', 'Production',
            'Plåt', 'Metal', 'Steel', 'Aluminum', 'Machine', 'Equipment', 'Tool', 'Component',
            'Assembly', 'Fabrication', 'Processing', 'Industrial', 'Workshop', 'Factory'
        ],
        'Construction & Building': [
            'Bygg', 'Construction', 'Anläggning', 'Installation', 'Renovering', 'Building',
            'Entreprenad', 'Contractor', 'Schakt', 'Excavation', 'Plumbing', 'Electrical',
            'Carpentry', 'Roofing', 'Painting', 'Flooring', 'Renovation', 'Development',
            'Property', 'Real Estate', 'Housing', 'Infrastructure'
        ],
        'Retail & Wholesale': [
            'Handel', 'Shop', 'Store', 'Butik', 'Retail', 'Försäljning', 'Sales', 'Wholesale',
            'Distribution', 'Supply', 'Import', 'Export', 'Trade', 'Commerce', 'Market',
            'Outlet', 'Department', 'Chain', 'Franchise', 'Merchandise', 'Consumer'
        ],
        'Food & Hospitality': [
            'Food', 'Mat', 'Restaurant', 'Café', 'Bar', 'Hotell', 'Hotel', 'Catering',
            'Kitchen', 'Bakery', 'Brewery', 'Beverage', 'Culinary', 'Hospitality',
            'Service', 'Cuisine', 'Dining', 'Event', 'Banquet', 'Wedding'
        ],
        'Transportation & Logistics': [
            'Transport', 'Logistik', 'Spedition', 'Frakt', 'Shipping', 'Delivery',
            'Logistics', 'Freight', 'Cargo', 'Trucking', 'Haulage', 'Distribution',
            'Warehouse', 'Storage', 'Supply Chain', 'Express', 'Courier'
        ],
        'Professional Services': [
            'Consulting', 'Konsult', 'Advisor', 'Consultant', 'Professional', 'Service',
            'Management', 'Strategy', 'Business', 'Corporate', 'Finance', 'Accounting',
            'Legal', 'Law', 'Advokat', 'Audit', 'Tax', 'Insurance', 'Investment'
        ],
        'Healthcare & Medical': [
            'Hälsa', 'Health', 'Medicin', 'Medical', 'Sjukhus', 'Vård', 'Care',
            'Dental', 'Tandvård', 'Clinic', 'Hospital', 'Pharmacy', 'Therapy',
            'Treatment', 'Surgery', 'Nursing', 'Rehabilitation', 'Wellness'
        ],
        'Education & Training': [
            'Utbildning', 'Education', 'Skola', 'School', 'Training', 'Kurs', 'Learning',
            'Academy', 'Institute', 'University', 'College', 'Teaching', 'Tutoring',
            'Development', 'Skills', 'Workshop', 'Seminar', 'Course'
        ],
        'Creative & Media': [
            'Design', 'Creative', 'Media', 'Marketing', 'Advertising', 'PR', 'Communication',
            'Graphic', 'Web', 'Digital', 'Content', 'Production', 'Studio', 'Agency',
            'Brand', 'Campaign', 'Social', 'Video', 'Photography', 'Art'
        ],
        'Automotive & Repair': [
            'Auto', 'Car', 'Vehicle', 'Bil', 'Motor', 'Engine', 'Repair', 'Service',
            'Maintenance', 'Parts', 'Accessories', 'Garage', 'Workshop', 'Mechanical',
            'Electrical', 'Bodywork', 'Paint', 'Tire', 'Brake'
        ],
        'Energy & Utilities': [
            'Energy', 'Power', 'Electric', 'Gas', 'Oil', 'Solar', 'Wind', 'Renewable',
            'Utility', 'Grid', 'Infrastructure', 'Water', 'Waste', 'Environment',
            'Sustainability', 'Green', 'Clean', 'Alternative'
        ]
    }
    
    # Create the classification table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS industry_classification (
            OrgNr TEXT PRIMARY KEY,
            name TEXT,
            industry_category TEXT,
            confidence_score REAL,
            matched_keywords TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Get all companies
    cursor.execute("""
        SELECT OrgNr, name
        FROM master_analytics 
        WHERE name IS NOT NULL
    """)
    
    companies = cursor.fetchall()
    print(f"Processing {len(companies)} companies...")
    
    classification_results = {}
    total_classified = 0
    
    for OrgNr, name in companies:
        name_upper = name.upper()
        best_category = None
        best_score = 0
        matched_keywords = []
        
        # Check each industry category
        for category, keywords in industry_patterns.items():
            score = 0
            category_matches = []
            
            for keyword in keywords:
                keyword_upper = keyword.upper()
                # Check for exact word matches (with word boundaries)
                pattern = r'\b' + re.escape(keyword_upper) + r'\b'
                if re.search(pattern, name_upper):
                    score += 2  # Full word match gets higher score
                    category_matches.append(keyword)
                # Check for partial matches
                elif keyword_upper in name_upper:
                    score += 1  # Partial match gets lower score
                    category_matches.append(keyword)
            
            if score > best_score:
                best_score = score
                best_category = category
                matched_keywords = category_matches
        
        # Store classification if we found a match
        if best_category and best_score > 0:
            confidence = min(best_score / 5.0, 1.0)  # Normalize to 0-1
            
            cursor.execute("""
                INSERT OR REPLACE INTO industry_classification 
                (OrgNr, name, industry_category, confidence_score, matched_keywords)
                VALUES (?, ?, ?, ?, ?)
            """, (OrgNr, name, best_category, confidence, ', '.join(matched_keywords)))
            
            classification_results[best_category] = classification_results.get(best_category, 0) + 1
            total_classified += 1
    
    conn.commit()
    
    print(f"\n✅ CLASSIFICATION COMPLETE!")
    print(f"   - {total_classified} companies classified")
    print(f"   - {len(companies) - total_classified} companies unclassified")
    
    print(f"\n📊 INDUSTRY DISTRIBUTION:")
    print("-" * 30)
    for category, count in sorted(classification_results.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total_classified) * 100
        print(f"  {category}: {count} companies ({percentage:.1f}%)")
    
    # Show some examples
    print(f"\n🔍 EXAMPLES BY CATEGORY:")
    print("-" * 30)
    
    for category in list(classification_results.keys())[:5]:  # Show top 5 categories
        cursor.execute("""
            SELECT name, matched_keywords, confidence_score
            FROM industry_classification 
            WHERE industry_category = ?
            ORDER BY confidence_score DESC
            LIMIT 3
        """, (category,))
        
        examples = cursor.fetchall()
        print(f"\n{category}:")
        for name, keywords, confidence in examples:
            print(f"  - {name[:40]} (Keywords: {keywords}, Confidence: {confidence:.2f})")
    
    conn.close()
    
    return classification_results

def create_size_based_classification():
    """
    Create size-based classification
    """
    db_path = Path(__file__).parent.parent / "allabolag.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"\n📏 CREATING SIZE-BASED CLASSIFICATION")
    print("=" * 40)
    
    # Create size classification table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS size_classification (
            OrgNr TEXT PRIMARY KEY,
            name TEXT,
            employee_count INTEGER,
            size_category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Get companies with employee data
    cursor.execute("""
        SELECT OrgNr, name, employees
        FROM master_analytics 
        WHERE employees IS NOT NULL AND employees != ''
    """)
    
    companies = cursor.fetchall()
    size_results = {}
    
    for OrgNr, name, employees in companies:
        try:
            emp_count = int(employees)
            
            # Classify by size
            if emp_count <= 10:
                size_category = 'Micro (1-10 employees)'
            elif emp_count <= 50:
                size_category = 'Small (11-50 employees)'
            elif emp_count <= 200:
                size_category = 'Medium (51-200 employees)'
            else:
                size_category = 'Large (200+ employees)'
            
            cursor.execute("""
                INSERT OR REPLACE INTO size_classification 
                (OrgNr, name, employee_count, size_category)
                VALUES (?, ?, ?, ?)
            """, (OrgNr, name, emp_count, size_category))
            
            size_results[size_category] = size_results.get(size_category, 0) + 1
            
        except (ValueError, TypeError):
            continue
    
    conn.commit()
    
    print(f"✅ SIZE CLASSIFICATION COMPLETE!")
    print(f"   - {sum(size_results.values())} companies classified")
    
    print(f"\n📊 SIZE DISTRIBUTION:")
    print("-" * 25)
    for category, count in sorted(size_results.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / sum(size_results.values())) * 100
        print(f"  {category}: {count} companies ({percentage:.1f}%)")
    
    conn.close()
    return size_results

def main():
    industry_results = create_name_based_classification()
    size_results = create_size_based_classification()
    
    print(f"\n\n🎯 ALTERNATIVE CLASSIFICATION SUMMARY:")
    print("=" * 45)
    print("✅ Created industry classification based on company names")
    print("✅ Created size classification based on employee count")
    print("✅ Both methods avoid relying on allabolag.se's mysterious codes")
    print("\n💡 These classifications can now be used in the dashboard!")
    print("   - Industry categories: Based on company name keywords")
    print("   - Size categories: Based on employee count")
    print("   - More reliable than unknown industry codes")

if __name__ == "__main__":
    main()








