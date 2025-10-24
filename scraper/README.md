# Multi-Source Web Scraper

A production-ready, multi-source web scraping system with plugin architecture, robust resume capability, and safe staging-to-production data flow.

## Features

- **Multi-Source Support**: Plugin architecture for different data sources (Allabolag, Ratsit, Mrkoll, etc.)
- **Three-Stage Process**: Segmentation → Company ID Resolution → Financial Data Fetching
- **Adaptive Rate Limiting**: Automatically adjusts speed to avoid bans while maximizing throughput
- **Robust Resume Capability**: Can restart from exact point of failure at page OR company level
- **Safe Data Flow**: Staging → validation → production prevents corrupt data
- **Night Mode**: Optimized settings for overnight financial data scraping
- **Audit Trail**: Every scrape job tracked with full metadata and error logging

## Architecture

```
scraper/
├── src/
│   ├── providers/
│   │   ├── base.ts              # Base provider interface
│   │   ├── allabolag/
│   │   │   ├── provider.ts      # Allabolag implementation
│   │   │   ├── segmentation.ts  # Stage 1: Search/filter
│   │   │   ├── company-ids.ts   # Stage 2: Get canonical IDs
│   │   │   ├── financials.ts    # Stage 3: Fetch financial data
│   │   │   └── rate-limiter.ts  # Adaptive rate limiting
│   │   ├── ratsit/              # Future: Ratsit.se
│   │   └── mrkoll/              # Future: Mrkoll.se
│   ├── core/
│   │   ├── job-manager.ts       # Job orchestration
│   │   ├── checkpoint.ts        # Resume capability
│   │   ├── staging.ts           # Staging table operations
│   │   └── validation.ts        # Data validation before migration
│   ├── lib/
│   │   ├── db/
│   │   │   ├── staging-schema.ts   # Staging tables
│   │   │   └── production-schema.ts # Production tables
│   └── config/
│       └── scraper.config.ts    # Configuration
├── database/
│   └── migrations/              # SQL migration files
└── allabolag-scraper/           # Existing Next.js app
```

## Three-Stage Scraping Process

### Stage 1: Segmentation (Company Search)
- Fetches companies matching revenue/profit filters
- Stores in `scraper_staging_companies` table
- Uses existing `/api/segment/start` endpoint

### Stage 2: Company ID Resolution
- Searches by orgnr to get canonical `companyId`
- Stores in `scraper_staging_company_ids` table
- Uses existing `/api/enrich/company-ids` endpoint

### Stage 3: Financial Data Fetching (NEW)
- Fetches financial data from Allabolag API
- Parses `annualReports` and extracts account codes
- Stores in `scraper_staging_financials` table
- Uses new `/api/financial/fetch` endpoint

## Database Schema

### Staging Tables
- `scraper_staging_jobs` - Job tracking and metadata
- `scraper_staging_companies` - Company basic information
- `scraper_staging_company_ids` - Company ID resolution
- `scraper_staging_financials` - Financial data with validation
- `scraper_checkpoints` - Resume capability tracking
- `migration_log` - Migration audit trail

### Production Tables
- `master_analytics` - Main company analytics
- `company_accounts_by_id` - Financial account data
- `company_kpis_by_id` - Calculated KPIs

## Setup

### 1. Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration
Run the SQL migration to create staging tables:
```sql
-- Run database/migrations/001_create_staging_tables.sql
```

### 3. Install Dependencies
```bash
cd allabolag-scraper
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## Usage

### 1. Start Scraping
1. Set filters (revenue, profit, company type)
2. Click "Start Scraping" to begin Stage 1
3. Monitor progress in real-time

### 2. Multi-Stage Workflow
- **Stage 1**: Company search and filtering
- **Stage 2**: Company ID resolution (automatic after Stage 1)
- **Stage 3**: Financial data fetching (automatic after Stage 2)

### 3. Data Validation
- Review validation results (valid, warnings, invalid)
- Check data quality before migration

### 4. Migration to Production
- Migrate validated data to production tables
- Skip duplicates automatically
- Generate migration report

## Rate Limiting

### Adaptive Rate Limiting
- Starts with 10 concurrent requests, 100ms delay
- Automatically adjusts based on success/failure rates
- Backs off aggressively on 429 (rate limit) responses
- Gradually speeds up on sustained success

### Night Mode
- Enabled by default for financial data fetching
- Runs 10 PM - 6 AM with optimized settings
- 10 concurrent requests, 200ms delay

## Resume Capability

### Page-Level Checkpointing
- Resume from last processed page
- Already implemented in existing system

### Company-Level Checkpointing (NEW)
- Track each company's status: 'pending', 'id_resolved', 'financials_fetched', 'error'
- Store checkpoint after every batch (every 50 companies)
- On resume: Query companies with status != 'financials_fetched' and != 'error'

## Data Validation

### Validation Rules
- **Required fields**: Company ID, orgnr, year, period
- **Year range**: 2000 to current year + 1
- **Revenue validation**: Non-negative, flag zero revenue
- **Profit validation**: Allow negative (losses)
- **EBITDA validation**: Flag unrealistic values
- **Equity validation**: Flag extreme negative equity
- **Consistency checks**: Flag all-zero metrics, unrealistic ratios
- **Currency validation**: Expect SEK

### Validation Status
- `valid` - Passes all checks
- `warning` - Has warnings but usable
- `invalid` - Has errors, should not be migrated

## API Endpoints

### Existing Endpoints
- `POST /api/segment/start` - Start segmentation job
- `GET /api/segment/status` - Get job status
- `POST /api/enrich/company-ids` - Start company ID enrichment

### New Endpoints
- `POST /api/financial/fetch` - Start financial data fetching
- `GET /api/financial/fetch` - Get financial fetch status
- `POST /api/staging/validate` - Validate staging data
- `GET /api/staging/validate` - Get validation preview
- `POST /api/staging/migrate` - Migrate to production
- `GET /api/staging/migrate` - Get migration history

## Configuration

### Rate Limiting Config
```typescript
export const scraperConfig = {
  allabolag: {
    rateLimiting: {
      stage1: { concurrent: 5, delay: 100 },
      stage2: { concurrent: 5, delay: 100 },
      stage3: { 
        concurrent: 10, 
        delay: 100,
        nightMode: {
          enabled: true,
          startHour: 22,
          endHour: 6,
          concurrent: 10,
          delay: 200,
        }
      },
    },
  },
};
```

## Adding New Providers

### 1. Create Provider Directory
```bash
mkdir src/providers/your-provider
```

### 2. Implement Provider Interface
```typescript
export class YourProvider implements ScraperProvider {
  name = 'your-provider';
  
  async *searchCompanies(filters: SearchFilters): AsyncGenerator<CompanyBasic> {
    // Implementation
  }
  
  async resolveCompanyId(orgnr: string, companyName?: string): Promise<string | null> {
    // Implementation
  }
  
  async fetchFinancials(companyId: string): Promise<FinancialData[]> {
    // Implementation
  }
  
  getRateLimitConfig(): RateLimitConfig {
    // Return provider-specific config
  }
}
```

### 3. Add Configuration
```typescript
// In scraper.config.ts
yourProvider: {
  rateLimiting: {
    stage1: { concurrent: 3, delay: 500 },
  }
}
```

### 4. Register Provider
Add to provider registry and update UI selector.

## Monitoring and Debugging

### Job Status Tracking
- Real-time progress updates
- Rate limiting statistics
- Error tracking and reporting
- Checkpoint information

### Logs and Debugging
- Console logs for each stage
- Error messages with context
- Rate limiting adjustments
- Validation results

### Performance Metrics
- Requests per second
- Success/failure rates
- Average response times
- Queue lengths

## Best Practices

### 1. Scraping Strategy
- Start with conservative rate limits
- Monitor for 429 responses
- Use night mode for large batches
- Test with small datasets first

### 2. Data Quality
- Always validate before migration
- Review warnings carefully
- Check for data anomalies
- Maintain audit trails

### 3. Error Handling
- Implement proper retry logic
- Log all errors with context
- Don't let single failures stop entire jobs
- Use checkpoints for recovery

### 4. Performance
- Use batch processing
- Implement proper indexing
- Monitor database performance
- Clean up old staging data

## Troubleshooting

### Common Issues

#### Rate Limiting
- **Problem**: Getting 429 responses
- **Solution**: Reduce concurrent requests, increase delay

#### Data Validation Failures
- **Problem**: High invalid record count
- **Solution**: Check data source, adjust validation rules

#### Resume Issues
- **Problem**: Not resuming from correct point
- **Solution**: Check checkpoint data, verify job status

#### Memory Issues
- **Problem**: Out of memory during large jobs
- **Solution**: Reduce batch size, process in smaller chunks

### Debug Commands
```bash
# Check job status
curl "http://localhost:3000/api/segment/status?jobId=your-job-id"

# Get validation preview
curl "http://localhost:3000/api/staging/validate?jobId=your-job-id"

# Check migration history
curl "http://localhost:3000/api/staging/migrate?jobId=your-job-id"
```

## Future Enhancements

### Planned Features
- [ ] Ratsit.se provider
- [ ] Mrkoll.se provider
- [ ] Advanced filtering options
- [ ] Data export functionality
- [ ] Scheduled scraping jobs
- [ ] Webhook notifications
- [ ] Advanced analytics dashboard

### Performance Improvements
- [ ] Parallel processing optimization
- [ ] Database query optimization
- [ ] Caching layer
- [ ] CDN integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
