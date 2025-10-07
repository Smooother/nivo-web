# Nivo - Swedish Company Intelligence Platform

A comprehensive system for scraping, analyzing, and visualizing Swedish company data from Allabolag.se, with a modern web interface and Supabase database integration.

## 🏗️ Project Structure

```
nivo/
├── 📁 backend/              # Python data processing & analysis
│   ├── *.py                # Scraping, analysis, and migration scripts
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── 📁 frontend/            # Next.js web application
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── lib/               # Supabase client configuration
│   ├── package.json       # Node.js dependencies
│   └── .env.local         # Frontend environment variables
├── 📁 database/           # Database schemas and migrations
│   ├── supabase_create_tables.sql
│   └── *.json            # Configuration files
├── 📁 outputs/            # Analysis results and reports
└── 📄 deploy.sh          # Deployment script
```

## 🚀 Features

### Backend (Python)
- **Data Scraping**: Automated scraping from Allabolag.se
- **Financial Analysis**: KPI calculations and company metrics
- **Data Processing**: Company segmentation and filtering
- **Database Migration**: SQLite to Supabase migration tools
- **AI Analysis**: Company potential scoring and risk assessment

### Frontend (Next.js)
- **Modern UI**: Beautiful, responsive web interface
- **Authentication**: Secure login with Supabase Auth
- **Data Visualization**: Interactive charts and tables
- **Search & Filter**: Advanced company search capabilities
- **Dashboard**: Comprehensive analytics dashboard

### Database (Supabase)
- **PostgreSQL**: Scalable cloud database
- **Real-time**: Live data updates
- **Authentication**: Built-in user management
- **API**: RESTful API for data access

## 📊 Data Overview

- **Companies**: 8,734+ Swedish companies
- **Financial Data**: 35,409+ financial records
- **KPIs**: Comprehensive financial metrics
- **Segmentation**: Industry and growth analysis
- **AI Insights**: Automated company scoring

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure your Supabase credentials in .env
```

### Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Configure your Supabase credentials in .env.local
npm run dev
```

### Database Setup
1. Create a Supabase project
2. Run the SQL migration: `database/supabase_create_tables.sql`
3. Configure environment variables with your Supabase credentials

## 🚀 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel deploy
```

### Supabase (Database)
- Database is automatically deployed to Supabase cloud
- Configure Row Level Security (RLS) policies as needed

## 📈 Usage

### Data Scraping
```bash
cd backend
python fetch_allabolag.py
```

### Analysis
```bash
cd backend
python analyze_top_companies.py
```

### Web Interface
- Visit your deployed Vercel URL
- Login with your credentials
- Explore company data and analytics

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📊 Key Tables

- `companies`: Main company information
- `company_accounts_by_id`: Financial data
- `company_kpis_by_id`: Calculated KPIs
- `segmentation_companies_raw`: Industry segmentation
- `ai_company_analysis`: AI-powered insights
- `website_fit_scores`: Website analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and research purposes.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Python, Next.js, and Supabase**# Environment variables added for preview
# OpenAI API key added to Vercel
