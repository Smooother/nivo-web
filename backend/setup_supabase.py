#!/usr/bin/env python3
"""
Supabase Setup Script
Helps configure Supabase project and environment variables
"""

import os
import json
import requests
from pathlib import Path

class SupabaseSetup:
    def __init__(self):
        self.env_file = Path(".env")
        self.config_file = Path("supabase_config.json")
    
    def create_env_template(self):
        """Create .env template file"""
        env_template = """# Supabase Configuration
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Connection (for direct PostgreSQL access)
SUPABASE_DB_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

# Website Configuration
WEBSITE_DOMAIN=your_domain_here
WEBSITE_NAME=Allabolag Analyzer

# Development
NODE_ENV=development
"""
        
        if not self.env_file.exists():
            with open(self.env_file, 'w') as f:
                f.write(env_template)
            print(f"✅ Created {self.env_file}")
            print("📝 Please edit .env file with your Supabase credentials")
        else:
            print(f"⚠️  {self.env_file} already exists")
    
    def get_supabase_credentials(self):
        """Interactive setup for Supabase credentials"""
        print("\n🔧 Supabase Setup")
        print("="*50)
        print("To get your Supabase credentials:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Create a new project or select existing one")
        print("3. Go to Settings > API")
        print("4. Copy the Project URL and API keys")
        print("5. Go to Settings > Database")
        print("6. Copy the database connection string")
        print()
        
        url = input("Enter your Supabase URL (https://xxx.supabase.co): ").strip()
        anon_key = input("Enter your Supabase Anon Key: ").strip()
        service_key = input("Enter your Supabase Service Role Key: ").strip()
        db_url = input("Enter your Database URL (postgresql://...): ").strip()
        domain = input("Enter your website domain (optional): ").strip()
        
        return {
            'SUPABASE_URL': url,
            'SUPABASE_ANON_KEY': anon_key,
            'SUPABASE_SERVICE_ROLE_KEY': service_key,
            'SUPABASE_DB_URL': db_url,
            'WEBSITE_DOMAIN': domain or 'localhost:3000',
            'WEBSITE_NAME': 'Allabolag Analyzer',
            'NODE_ENV': 'development'
        }
    
    def update_env_file(self, credentials):
        """Update .env file with credentials"""
        env_content = ""
        for key, value in credentials.items():
            env_content += f"{key}={value}\n"
        
        with open(self.env_file, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Updated {self.env_file}")
    
    def test_connection(self, credentials):
        """Test Supabase connection"""
        try:
            import requests
            
            # Test API connection
            headers = {
                'apikey': credentials['SUPABASE_ANON_KEY'],
                'Authorization': f"Bearer {credentials['SUPABASE_ANON_KEY']}"
            }
            
            response = requests.get(f"{credentials['SUPABASE_URL']}/rest/v1/", headers=headers)
            
            if response.status_code == 200:
                print("✅ Supabase API connection successful")
                return True
            else:
                print(f"❌ Supabase API connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Connection test failed: {str(e)}")
            return False
    
    def install_dependencies(self):
        """Install required Python packages"""
        packages = [
            'supabase',
            'psycopg2-binary',
            'python-dotenv',
            'pandas',
            'sqlalchemy',
            'requests'
        ]
        
        print("📦 Installing required packages...")
        for package in packages:
            os.system(f"pip install {package}")
        
        print("✅ Dependencies installed")
    
    def run_setup(self):
        """Run the complete setup process"""
        print("🚀 Supabase Setup for Allabolag Analyzer")
        print("="*50)
        
        # Step 1: Create .env template
        self.create_env_template()
        
        # Step 2: Get credentials
        print("\n📋 Please provide your Supabase credentials:")
        credentials = self.get_supabase_credentials()
        
        # Step 3: Update .env file
        self.update_env_file(credentials)
        
        # Step 4: Test connection
        print("\n🔍 Testing connection...")
        if self.test_connection(credentials):
            print("\n🎉 Setup completed successfully!")
            print("\nNext steps:")
            print("1. Run: python migrate_to_supabase.py")
            print("2. Set up your website with the provided credentials")
        else:
            print("\n❌ Setup failed. Please check your credentials.")
        
        # Step 5: Install dependencies
        install_deps = input("\nInstall required Python packages? (y/n): ").lower()
        if install_deps == 'y':
            self.install_dependencies()

def main():
    setup = SupabaseSetup()
    setup.run_setup()

if __name__ == "__main__":
    main()
