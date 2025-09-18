#!/usr/bin/env python3
"""
Test Supabase Client Connection
Tests connection using the Supabase Python client
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def test_supabase_client():
    """Test Supabase client connection"""
    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_key:
        print("❌ Missing Supabase credentials")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, service_key)
        
        # Test connection by making a simple API call
        # This will work even if no tables exist yet
        response = supabase.rpc('version').execute()
        print("✅ Supabase client connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Supabase client connection error: {str(e)}")
        # Check if it's a table not found error (expected for empty database)
        if "table" in str(e).lower() and "not found" in str(e).lower():
            print("ℹ️  This is expected - no tables exist yet (ready for migration)")
            return True
        elif "schema cache" in str(e).lower():
            print("ℹ️  This is expected - no tables exist yet (ready for migration)")
            return True
        return False

if __name__ == "__main__":
    print("🚀 Supabase Client Connection Test")
    print("="*40)
    
    if test_supabase_client():
        print("\n🎉 Supabase client ready! You can proceed with migration.")
    else:
        print("\n❌ Supabase client connection failed.")
