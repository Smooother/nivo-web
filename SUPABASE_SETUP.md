# Supabase Migration & Website Setup Guide

This guide will help you migrate your SQLite database to Supabase and set up a complete website with authentication.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Domain**: You mentioned you have a domain - we'll configure it
3. **Python 3.8+**: For running migration scripts
4. **Node.js 18+**: For the website

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `allabolag-analyzer`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Your Credentials
1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

3. Go to **Settings > Database**
4. Copy the **Connection string** (starts with `postgresql://`)

## Step 2: Environment Setup

### 2.1 Run the Setup Script
```bash
python setup_supabase.py
```

This will:
- Create a `.env` file template
- Guide you through entering your Supabase credentials
- Test the connection
- Install required Python packages

### 2.2 Manual Environment Setup (Alternative)
If the script doesn't work, create a `.env` file manually:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres

# Website Configuration
WEBSITE_DOMAIN=your_domain_here
WEBSITE_NAME=Allabolag Analyzer
NODE_ENV=development
```

## Step 3: Database Migration

### 3.1 Install Dependencies
```bash
pip install supabase psycopg2-binary python-dotenv pandas sqlalchemy requests
```

### 3.2 Run Migration
```bash
python migrate_to_supabase.py
```

This will:
- Analyze your SQLite database structure
- Create corresponding tables in Supabase
- Migrate all data
- Set up indexes for performance
- Configure Row Level Security (RLS)

### 3.3 Verify Migration
The script will show a summary of migrated tables and row counts. All tables should show ✓ indicating successful migration.

## Step 4: Website Setup

### 4.1 Navigate to Website Directory
```bash
cd website
```

### 4.2 Install Dependencies
```bash
npm install
```

### 4.3 Configure Environment
Copy the example environment file and update with your credentials:
```bash
cp env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_WEBSITE_NAME=Allabolag Analyzer
NEXT_PUBLIC_WEBSITE_DOMAIN=your_domain_here
```

### 4.4 Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your website!

## Step 5: Authentication Setup

### 5.1 Configure Supabase Auth
1. Go to **Authentication > Settings** in Supabase dashboard
2. Configure:
   - **Site URL**: `https://your-domain.com` (or `http://localhost:3000` for development)
   - **Redirect URLs**: Add your domain URLs
   - **Email Templates**: Customize as needed

### 5.2 Test Authentication
1. Visit your website
2. Click "Sign Up" to create a test account
3. Check your email for confirmation
4. Sign in and verify access to the dashboard

## Step 6: Production Deployment

### 6.1 Build for Production
```bash
cd website
npm run build
```

### 6.2 Deploy Options

#### Option A: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Add your environment variables in Vercel dashboard

#### Option B: Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Add environment variables in Netlify dashboard

#### Option C: Your Own Server
1. Set up a server with Node.js
2. Install PM2: `npm install -g pm2`
3. Start with: `pm2 start npm --name "allabolag-analyzer" -- start`

### 6.3 Domain Configuration
1. Point your domain to your hosting provider
2. Update Supabase auth settings with your production domain
3. Update environment variables with production URLs

## Step 7: Security & Performance

### 7.1 Row Level Security (RLS)
The migration script automatically sets up RLS policies. You can customize them in Supabase dashboard under **Authentication > Policies**.

### 7.2 API Rate Limiting
Configure rate limiting in Supabase dashboard under **Settings > API**.

### 7.3 Database Backups
Enable automatic backups in Supabase dashboard under **Settings > Database**.

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check your Supabase URL and keys
   - Verify your database password
   - Ensure your IP is not blocked

2. **Migration Errors**
   - Check data types compatibility
   - Verify table names don't conflict
   - Check for special characters in data

3. **Authentication Issues**
   - Verify site URL in Supabase settings
   - Check email confirmation settings
   - Ensure proper redirect URLs

4. **Website Build Errors**
   - Check Node.js version (18+ required)
   - Verify all environment variables
   - Clear `.next` folder and rebuild

### Getting Help

1. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
3. Review the migration logs for specific errors

## Next Steps

Once everything is set up:

1. **Customize the website** design and functionality
2. **Add more features** like advanced filtering, charts, exports
3. **Set up monitoring** and analytics
4. **Implement user roles** and permissions
5. **Add API endpoints** for external integrations

## File Structure

```
allabolag_scraper/
├── migrate_to_supabase.py      # Database migration script
├── setup_supabase.py           # Setup helper script
├── .env                        # Environment variables
├── allabolag.db               # Your SQLite database
└── website/                   # Next.js website
    ├── components/            # React components
    ├── lib/                   # Utilities and Supabase client
    ├── pages/                 # Next.js pages
    ├── styles/                # CSS styles
    └── package.json           # Dependencies
```

## Support

If you encounter issues:
1. Check the logs from migration and website
2. Verify all environment variables are set correctly
3. Ensure your Supabase project is active and accessible
4. Test with a simple query to verify database connectivity

Good luck with your Allabolag Analyzer project! 🚀
