#!/usr/bin/env python3
"""
Test Supabase Connection
This script tests the connection to your Supabase project
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    """Test Supabase API connection"""
    supabase_url = os.getenv('SUPABASE_URL')
    anon_key = os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not anon_key:
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    print(f"🔍 Testing connection to: {supabase_url}")
    
    # Test API connection
    headers = {
        'apikey': anon_key,
        'Authorization': f"Bearer {anon_key}",
        'Content-Type': 'application/json'
    }
    
    try:
        # Test basic API access
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        
        if response.status_code == 200:
            print("✅ Supabase API connection successful!")
            print("✅ Your anon key is working correctly")
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")
        return False

def get_service_role_key_instructions():
    """Print instructions for getting the service role key"""
    print("\n" + "="*60)
    print("🔑 SERVICE ROLE KEY REQUIRED")
    print("="*60)
    print("To complete the setup, you need the Service Role Key:")
    print()
    print("1. Go to your Supabase dashboard:")
    print("   https://supabase.com/dashboard/project/clysgodrmowieximfaab")
    print()
    print("2. Navigate to: Settings > API")
    print()
    print("3. Copy the 'service_role' key (NOT the anon key)")
    print("   It should start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    print()
    print("4. Update your .env file:")
    print("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here")
    print()
    print("⚠️  IMPORTANT: Keep the service role key secret!")
    print("   It has full access to your database.")
    print("="*60)

if __name__ == "__main__":
    print("🚀 Supabase Connection Test")
    print("="*40)
    
    if test_connection():
        get_service_role_key_instructions()
    else:
        print("\n❌ Please check your Supabase credentials in the .env file")
