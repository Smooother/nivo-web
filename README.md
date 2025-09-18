# Nivo - Swedish Company Intelligence Platform

A comprehensive platform for analyzing Swedish companies, combining a beautiful marketing website with powerful data analysis capabilities.

## 🏗️ Project Structure

```
nivo-web/
├── 📁 src/                    # Frontend (Vite + React + TypeScript)
│   ├── components/            # React components
│   ├── pages/                # Application pages
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities and configurations
├── 📁 backend/               # Python data processing & analysis
│   ├── *.py                  # Scraping, analysis, and migration scripts
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
├── 📁 database/              # Database schemas and migrations
│   ├── supabase_create_tables.sql
│   └── *.json                # Configuration files
├── 📁 outputs/               # Analysis results and reports
├── 📁 public/                # Static assets
└── 📄 package.json           # Node.js dependencies
```

## 🚀 Features

### Frontend (Vite + React)
- **Modern Landing Page**: Beautiful marketing website for Nivo
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Components**: Built with shadcn-ui components
- **Animations**: Smooth transitions and effects
- **SEO Optimized**: Meta tags and structured data

### Backend (Python)
- **Data Scraping**: Automated scraping from Allabolag.se
- **Financial Analysis**: KPI calculations and company metrics
- **Data Processing**: Company segmentation and filtering
- **Database Migration**: SQLite to Supabase migration tools
- **AI Analysis**: Company potential scoring and risk assessment

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
- Node.js 16+
- Python 3.8+
- Supabase account
- Git

### Frontend Setup (Marketing Website)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup (Data Analysis)
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your Supabase credentials to .env
```

### Database Setup
1. Create a Supabase project
2. Run the SQL migration: `database/supabase_create_tables.sql`
3. Configure environment variables with your Supabase credentials

## 🚀 Deployment

### Frontend (Vercel)
The frontend is automatically deployed to Vercel via Lovable:
- **Lovable**: https://lovable.dev/projects/f34e3a91-e821-4705-9e65-257dcf59254e
- **Vercel**: Automatically deployed from this repository

### Backend (Local/Server)
```bash
cd backend
# Run data processing scripts
python fetch_allabolag.py
python analyze_top_companies.py
```

### Database (Supabase)
- Database is automatically deployed to Supabase cloud
- Configure Row Level Security (RLS) policies as needed

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Frontend (if needed)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📊 Key Database Tables

- `companies`: Main company information
- `company_accounts_by_id`: Financial data
- `company_kpis_by_id`: Calculated KPIs
- `segmentation_companies_raw`: Industry segmentation
- `ai_company_analysis`: AI-powered insights
- `website_fit_scores`: Website analysis

## 🎨 Frontend Technologies

- **Vite**: Fast build tool and dev server
- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful UI components
- **Framer Motion**: Animations (if used)

## 🤝 Development Workflow

### Using Lovable (Recommended)
1. Visit the [Lovable Project](https://lovable.dev/projects/f34e3a91-e821-4705-9e65-257dcf59254e)
2. Make changes via prompts
3. Changes are automatically committed to this repository

### Local Development
```bash
# Clone the repository
git clone https://github.com/smooother/nivo-web.git
cd nivo-web

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Development
```bash
cd backend
source venv/bin/activate
python your_script.py
```

## 📈 Usage

### Data Analysis
```bash
cd backend
python fetch_allabolag.py      # Scrape new data
python analyze_top_companies.py # Analyze companies
python database_manager.py      # Manage database
```

### Website Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## 🆘 Support

For issues and questions:
1. Check the documentation above
2. Review existing issues in the repository
3. Create a new issue with detailed information

## 📄 License

This project is for educational and research purposes.

---

**Built with ❤️ using React, Python, and Supabase**

**Powered by [Lovable](https://lovable.dev) for rapid frontend development**