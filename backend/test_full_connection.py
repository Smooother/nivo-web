#!/usr/bin/env python3
"""
Test Full Supabase Connection
Tests both anon key and service role key connections
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_anon_connection():
    """Test Supabase API connection with anon key"""
    supabase_url = os.getenv('SUPABASE_URL')
    anon_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not anon_key:
        print("❌ Missing Supabase URL or anon key")
        return False
    
    headers = {
        'apikey': anon_key,
        'Authorization': f"Bearer {anon_key}",
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        if response.status_code == 200:
            print("✅ Anon key connection successful")
            return True
        else:
            print(f"❌ Anon key connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Anon key connection error: {str(e)}")
        return False

def test_service_role_connection():
    """Test Supabase API connection with service role key"""
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not service_key:
        print("❌ Missing service role key")
        return False
    
    if service_key == "your_service_role_key_here":
        print("❌ Service role key not updated in .env file")
        return False
    
    headers = {
        'apikey': service_key,
        'Authorization': f"Bearer {service_key}",
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        if response.status_code == 200:
            print("✅ Service role key connection successful")
            return True
        else:
            print(f"❌ Service role key connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service role key connection error: {str(e)}")
        return False

def test_database_connection():
    """Test direct database connection"""
    from sqlalchemy import create_engine, text
    
    db_url = os.getenv('SUPABASE_DB_URL')
    if not db_url:
        print("❌ Missing database URL")
        return False
    
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Full Supabase Connection Test")
    print("="*50)
    
    anon_ok = test_anon_connection()
    service_ok = test_service_role_connection()
    db_ok = test_database_connection()
    
    print("\n" + "="*50)
    print("SUMMARY:")
    print(f"Anon Key: {'✅' if anon_ok else '❌'}")
    print(f"Service Role Key: {'✅' if service_ok else '❌'}")
    print(f"Database Connection: {'✅' if db_ok else '❌'}")
    
    if anon_ok and service_ok and db_ok:
        print("\n🎉 All connections successful! Ready for migration.")
    else:
        print("\n⚠️  Some connections failed. Please check your credentials.")
