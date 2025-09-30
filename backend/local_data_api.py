#!/usr/bin/env python3
"""
Local Data API Server
Serves data from the local SQLite database to the frontend
"""

import os
import sqlite3
import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

app = FastAPI(title="Nivo Local Data API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path
DB_PATH = "../allabolag.db"

def get_db_connection():
    """Get database connection"""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="Database not found")
    return sqlite3.connect(DB_PATH)

class CompanyResponse(BaseModel):
    OrgNr: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    incorporation_date: Optional[str] = None
    email: Optional[str] = None
    homepage: Optional[str] = None
    segment: Optional[str] = None
    segment_name: Optional[str] = None
    industry_name: Optional[str] = None
    revenue: Optional[str] = None
    profit: Optional[str] = None
    employees: Optional[str] = None
    SDI: Optional[float] = None
    DR: Optional[float] = None
    ORS: Optional[float] = None
    Revenue_growth: Optional[float] = None
    EBIT_margin: Optional[float] = None
    NetProfit_margin: Optional[float] = None
    company_size_category: Optional[str] = None
    employee_size_category: Optional[str] = None
    profitability_category: Optional[str] = None
    growth_category: Optional[str] = None

class SearchResults(BaseModel):
    companies: List[CompanyResponse]
    total: int
    summary: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "Nivo Local Data API", "version": "1.0.0"}

@app.get("/companies", response_model=SearchResults)
async def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    name: Optional[str] = None,
    industry: Optional[str] = None,
    city: Optional[str] = None,
    minRevenue: Optional[float] = None,
    maxRevenue: Optional[float] = None,
    minProfit: Optional[float] = None,
    maxProfit: Optional[float] = None,
    minRevenueGrowth: Optional[float] = None,
    maxRevenueGrowth: Optional[float] = None,
    minEBITAmount: Optional[float] = None,
    maxEBITAmount: Optional[float] = None,
    minEmployees: Optional[int] = None,
    maxEmployees: Optional[int] = None,
    profitability: Optional[str] = None,
    size: Optional[str] = None,
    growth: Optional[str] = None
):
    """Get companies with filtering and pagination"""
    try:
        conn = get_db_connection()
        
        # Build WHERE clause
        where_conditions = []
        params = []
        
        if name:
            where_conditions.append("name LIKE ?")
            params.append(f"%{name}%")
        
        if industry:
            where_conditions.append("industry_name LIKE ?")
            params.append(f"%{industry}%")
        
        if city:
            where_conditions.append("city LIKE ?")
            params.append(f"%{city}%")
        
        if minRevenue is not None:
            where_conditions.append("CAST(revenue AS REAL) >= ?")
            params.append(minRevenue * 1000000)  # Convert million SEK to SEK
        
        if maxRevenue is not None:
            where_conditions.append("CAST(revenue AS REAL) <= ?")
            params.append(maxRevenue * 1000000)  # Convert million SEK to SEK
        
        if minProfit is not None:
            where_conditions.append("CAST(profit AS REAL) >= ?")
            params.append(minProfit * 1000000)  # Convert million SEK to SEK
        
        if maxProfit is not None:
            where_conditions.append("CAST(profit AS REAL) <= ?")
            params.append(maxProfit * 1000000)  # Convert million SEK to SEK
        
        if minRevenueGrowth is not None:
            where_conditions.append("Revenue_growth >= ?")
            params.append(minRevenueGrowth)
        
        if maxRevenueGrowth is not None:
            where_conditions.append("Revenue_growth <= ?")
            params.append(maxRevenueGrowth)
        
        if minEBITAmount is not None:
            # Filter by EBIT amount (EBIT margin * revenue)
            where_conditions.append("(EBIT_margin * CAST(revenue AS REAL)) >= ?")
            params.append(minEBITAmount * 1000000)  # Convert million SEK to SEK
        
        if maxEBITAmount is not None:
            where_conditions.append("(EBIT_margin * CAST(revenue AS REAL)) <= ?")
            params.append(maxEBITAmount * 1000000)  # Convert million SEK to SEK
        
        if minEmployees is not None:
            where_conditions.append("CAST(employees AS INTEGER) >= ?")
            params.append(minEmployees)
        
        if maxEmployees is not None:
            where_conditions.append("CAST(employees AS INTEGER) <= ?")
            params.append(maxEmployees)
        
        if profitability:
            where_conditions.append("profitability_category = ?")
            params.append(profitability)
        
        if size:
            where_conditions.append("company_size_category = ?")
            params.append(size)
        
        if growth:
            where_conditions.append("growth_category = ?")
            params.append(growth)
        
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM master_analytics WHERE {where_clause}"
        cursor = conn.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Get paginated results
        offset = (page - 1) * limit
        query = f"""
            SELECT * FROM master_analytics 
            WHERE {where_clause}
            ORDER BY name
            LIMIT ? OFFSET ?
        """
        cursor = conn.execute(query, params + [limit, offset])
        
        columns = [description[0] for description in cursor.description]
        companies = []
        
        for row in cursor.fetchall():
            company_dict = dict(zip(columns, row))
            # Convert numeric strings to numbers where appropriate
            if company_dict.get('revenue') and company_dict['revenue'].replace('.', '').replace('-', '').isdigit():
                company_dict['revenue'] = str(int(float(company_dict['revenue'])))
            if company_dict.get('profit') and company_dict['profit'].replace('.', '').replace('-', '').isdigit():
                company_dict['profit'] = str(int(float(company_dict['profit'])))
            companies.append(CompanyResponse(**company_dict))
        
        # Calculate summary statistics
        summary_query = f"""
            SELECT 
                AVG(CAST(revenue AS REAL)) as avg_revenue,
                AVG(Revenue_growth) as avg_growth,
                AVG(EBIT_margin) as avg_margin,
                COUNT(DISTINCT industry_name) as industry_count
            FROM master_analytics 
            WHERE {where_clause} AND revenue IS NOT NULL AND revenue != ''
        """
        cursor = conn.execute(summary_query, params)
        summary_row = cursor.fetchone()
        
        # Get top industries
        industry_query = f"""
            SELECT industry_name, COUNT(*) as count
            FROM master_analytics 
            WHERE {where_clause} AND industry_name IS NOT NULL
            GROUP BY industry_name
            ORDER BY count DESC
            LIMIT 5
        """
        cursor = conn.execute(industry_query, params)
        top_industries = [{"industry": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        # Get top cities
        city_query = f"""
            SELECT city, COUNT(*) as count
            FROM master_analytics 
            WHERE {where_clause} AND city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC
            LIMIT 5
        """
        cursor = conn.execute(city_query, params)
        top_cities = [{"city": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        summary = {
            "avgRevenue": (summary_row[0] or 0) / 1000000,  # Convert to million SEK
            "avgGrowth": summary_row[1] or 0,
            "avgMargin": summary_row[2] or 0,
            "topIndustries": top_industries,
            "topCities": top_cities
        }
        
        conn.close()
        
        return SearchResults(
            companies=companies,
            total=total,
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/companies/{orgnr}", response_model=CompanyResponse)
async def get_company(orgnr: str):
    """Get a specific company by organization number"""
    try:
        conn = get_db_connection()
        cursor = conn.execute("SELECT * FROM master_analytics WHERE OrgNr = ?", (orgnr,))
        
        columns = [description[0] for description in cursor.description]
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company_dict = dict(zip(columns, row))
        conn.close()
        
        return CompanyResponse(**company_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/companies/search")
async def search_companies(q: str = Query(..., min_length=2), limit: int = Query(20, ge=1, le=100)):
    """Search companies by name"""
    try:
        conn = get_db_connection()
        query = """
            SELECT * FROM master_analytics 
            WHERE name LIKE ? 
            ORDER BY name
            LIMIT ?
        """
        cursor = conn.execute(query, (f"%{q}%", limit))
        
        columns = [description[0] for description in cursor.description]
        companies = []
        
        for row in cursor.fetchall():
            company_dict = dict(zip(columns, row))
            companies.append(CompanyResponse(**company_dict))
        
        conn.close()
        
        return {"companies": companies}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics"""
    try:
        conn = get_db_connection()
        
        # Total companies
        cursor = conn.execute("SELECT COUNT(*) FROM master_analytics")
        total_companies = cursor.fetchone()[0]
        
        # Companies with financial data
        cursor = conn.execute("""
            SELECT COUNT(*) FROM master_analytics 
            WHERE revenue IS NOT NULL AND revenue != ''
        """)
        total_with_financials = cursor.fetchone()[0]
        
        # Companies with KPIs
        cursor = conn.execute("""
            SELECT COUNT(*) FROM master_analytics 
            WHERE SDI IS NOT NULL OR DR IS NOT NULL OR ORS IS NOT NULL
        """)
        total_with_kpis = cursor.fetchone()[0]
        
        # Companies with digital presence
        cursor = conn.execute("""
            SELECT COUNT(*) FROM master_analytics 
            WHERE homepage IS NOT NULL AND homepage != ''
        """)
        total_with_digital = cursor.fetchone()[0]
        
        # Average metrics (filter out extreme values - cap at ±100% growth)
        cursor = conn.execute("""
            SELECT 
                AVG(CASE WHEN Revenue_growth IS NOT NULL AND Revenue_growth > -1 AND Revenue_growth < 1 THEN Revenue_growth ELSE NULL END) as avg_growth,
                AVG(CASE WHEN EBIT_margin IS NOT NULL AND ABS(EBIT_margin) < 1 THEN EBIT_margin ELSE NULL END) as avg_margin
            FROM master_analytics 
            WHERE Revenue_growth IS NOT NULL AND EBIT_margin IS NOT NULL
        """)
        avg_row = cursor.fetchone()
        avg_growth = avg_row[0] if avg_row[0] is not None else 0
        avg_margin = avg_row[1] if avg_row[1] is not None else 0
        
        conn.close()
        
        return {
            "totalCompanies": total_companies,
            "totalWithFinancials": total_with_financials,
            "totalWithKPIs": total_with_kpis,
            "totalWithDigitalPresence": total_with_digital,
            "averageRevenueGrowth": avg_growth,
            "averageEBITMargin": avg_margin
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/industries")
async def get_industry_stats():
    """Get industry statistics"""
    try:
        conn = get_db_connection()
        query = """
            SELECT 
                industry_name,
                COUNT(*) as count,
                AVG(CAST(revenue AS REAL)) as avg_revenue,
                AVG(Revenue_growth) as avg_growth
            FROM master_analytics 
            WHERE industry_name IS NOT NULL
            GROUP BY industry_name
            ORDER BY count DESC
        """
        cursor = conn.execute(query)
        
        industries = []
        for row in cursor.fetchall():
            industries.append({
                "name": row[0],
                "count": row[1],
                "avgRevenue": row[2] or 0,
                "avgGrowth": row[3] or 0
            })
        
        conn.close()
        return industries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/cities")
async def get_city_stats():
    """Get city statistics"""
    try:
        conn = get_db_connection()
        query = """
            SELECT 
                city,
                COUNT(*) as count,
                AVG(CAST(revenue AS REAL)) as avg_revenue,
                AVG(Revenue_growth) as avg_growth
            FROM master_analytics 
            WHERE city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC
        """
        cursor = conn.execute(query)
        
        cities = []
        for row in cursor.fetchall():
            cities.append({
                "name": row[0],
                "count": row[1],
                "avgRevenue": row[2] or 0,
                "avgGrowth": row[3] or 0
            })
        
        conn.close()
        return cities
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
