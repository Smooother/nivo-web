# Deployment Notes

## Vercel Admin Account
**IMPORTANT**: Always use `jesper@smoother.com` as the admin account for Vercel deployments and management.

- Vercel CLI commands should be run with this account
- Vercel dashboard access uses this account
- NOT jesper@rgcapital.se - this is different from the application admin

## Current Status Summary

### Git Branch Status
- **Current Branch**: `main` 
- **Main Branch**: `main`
- **Status**: ✅ PRODUCTION READY - All features merged to main and deployed

### Running Services
1. **Frontend (Vite)**: Running on port 3000 (node process 76852)
2. **Allabolag Scraper**: Running on port 3001 (Next.js process 64261)
3. **Drizzle Studio**: Running (process 2550)
4. **Python Services**: Running on port 8000 (process 35558)

### Vercel Deployment Status
- **Domain**: nivogroup.se
- **Latest Production Version**: https://nivo-55etcdtb0-jesper-kreugers-projects.vercel.app ✅ MERGED TO MAIN - PRODUCTION READY
- **Previous Working Version**: https://nivo-24hfoyevx-jesper-kreugers-projects.vercel.app ✅ DEPLOYED WITH ALLABOLAG-STYLE POPUP & SWEDISH TRANSLATIONS
- **Previous Deployments**: 
  - https://nivo-fetdj5mk4-jesper-kreugers-projects.vercel.app (SUCCESS - fixed errors)
  - https://nivo-ajmrazt0j-jesper-kreugers-projects.vercel.app (ERROR - fixed)
  - https://nivo-p9upbsy2u-jesper-kreugers-projects.vercel.app (4 days ago)
- **Production URLs**: 
  - https://www.nivogroup.se (main domain) ✅ WORKING
  - https://nivogroup.se ✅ WORKING
  - https://nivo-web.vercel.app
- **Current Live Version**: ✅ FULLY FUNCTIONAL with Supabase database (8,438 companies)

### Local vs Remote Status
- **Local**: Cleaned up codebase, removed obsolete files, added new analytics components
- **Remote**: Last successful deployment was 4 days ago, latest deployment failed
- **Branch**: Working on `allabolag-scraper` branch (not main)

### Recent Changes Made
- Removed 80+ obsolete files (duplicate components, old reports, temporary scripts)
- Fixed frontend build issues (removed deleted component imports)
- Added new analytics components:
  - AdvancedAnalyticsDashboard.tsx
  - TrendAnalysis.tsx
- Updated WorkingDashboard.tsx and Admin.tsx
- Cleaned up backend temporary scripts and database files

### Next Steps
1. Test all local services
2. Fix any remaining build issues
3. Commit changes to git
4. Deploy to Vercel using jesper@smoother.com account
5. Test production deployment

## Service URLs
- **Local Frontend**: http://localhost:8080 ✅
- **Local Scraper**: http://localhost:3001 ✅
- **Python API**: http://localhost:8000 ✅
- **Drizzle Studio**: http://localhost:4983
- **Production**: https://nivogroup.se
