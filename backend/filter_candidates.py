import pandas as pd
from sqlalchemy import create_engine
import datetime

# Additional sectors to exclude
ADDITIONAL_EXCLUDE_SECTORS = [
    "Apoteksvaror, läkemedel - Partihandel",  # Highly regulated
    "Gummivaror",  # Low-tech manufacturing
    "Plåtslagerier",  # Traditional manufacturing
    "Lantbruksmaskiner, förnödenheter",  # Agricultural
    "Köttprodukter, slakteriprodukter",  # Food processing
    "Bilreservdelar",  # Traditional retail
    "Tryckerier",  # Declining industry
    "Skogstjänster",  # Traditional industry
    "Livsmedel - agenturer och grossister",  # Food wholesale
    "Spedition",  # Traditional logistics
    "Konferensarrangörer",  # Event-based business
    "Reklambyråer",  # Traditional marketing
    "Insatsvaror - grossister",  # Traditional wholesale
    "Järnvaror",  # Traditional manufacturing
    "Förpackningar - Industrin",  # Traditional manufacturing
    "Arbetskraftstjänster",  # Staffing
    "Bemanningsföretag",  # Staffing
    "Bokhandlare",  # Declining retail
    "Detaljhandel",  # B2C retail
    "Detaljhandel - annat",  # B2C retail
    "Butikshandel -övrigt",  # B2C retail
    "Hotell",  # Hospitality
    "Resor",  # Travel
    "Catering",  # Food service
    "Restaurangutrustningar, storköksutrustningar",  # Food service
    "Tobak",  # Declining industry
    "Tobak - grossist",  # Declining industry
    "Vinagenturer, spritagenturer",  # Alcohol
    "Kaffe och te - agenturer",  # Food wholesale
    "Dryckesvaror",  # Beverages
    "Mineralvatten",  # Beverages
    "Glass",  # Food
    "Kött-, slakteriprodukter - grossist",  # Food wholesale
    "Fruktleveranser, vattenleveranser",  # Food delivery
    "Grönsaker",  # Food
    "Odling av potatis",  # Agriculture
    "Odling av socker",  # Agriculture
    "Jordbruk - odling och djurhållning",  # Agriculture
    "Fisk, skaldjur",  # Food
    "Fiskodling, skaldjursodling, sportfiske",  # Aquaculture
    "Hästhållning",  # Animal husbandry
    "Golfbanor",  # Leisure
    "Sportanläggningar",  # Leisure
    "Skidsportanläggningar",  # Leisure
    "Motorcykel, ATV och mopedverkstäder",  # Vehicle repair
    "Fordonsreparationer",  # Vehicle repair
    "Bilvård",  # Vehicle service
    "Biluthyrning, bussuthyrning",  # Vehicle rental
    "Busstrafik, biltrafik",  # Transportation
    "Passagerartransporter",  # Transportation
    "Lastbilar, släpfordon",  # Vehicle sales
    "Övriga fordon",  # Vehicle sales
    "Bilar",  # Vehicle sales
    "Bilar - tillverkning",  # Vehicle manufacturing
    "Båtar, båtmotorer",  # Vehicle sales
    "Båttillbehör, båtutrustningar",  # Vehicle accessories
    "Båtvarv, båtbyggare",  # Vehicle manufacturing
    "Flygplan, utrustningar",  # Aviation
    "Flygplan, utrustningar - reparationer och underhåll",  # Aviation
    "Flygplatser",  # Aviation
    "Flyttfirmor",  # Moving services
    "Begravningsbyråer och krematorier",  # Funeral services
    "Tandläkare",  # Healthcare
    "Veterinärer",  # Healthcare
    "Omvårdnad och omsorg",  # Healthcare
    "Hälsotjänster",  # Healthcare
    "Hälsokost, naturläkemedel",  # Health products
    "Hudvårdsprodukter",  # Beauty products
    "Kosmetik - tillverkare och grossister",  # Beauty products
    "Kosmetik, parfym och frisörartiklar",  # Beauty products
    "Guld, silver, ädelstenar",  # Jewelry
    "Guldsmeder",  # Jewelry
    "Bijouteri - tillverkning",  # Jewelry
    "Klockor, ur",  # Watches
    "Klockor, ur - produktion",  # Watches
    "Skor",  # Footwear
    "Skor - detaljister",  # Footwear
    "Kläder",  # Clothing
    "Kläder - produktion",  # Clothing
    "Konfektion",  # Clothing
    "Textilier",  # Textiles
    "Textilier - Agentur",  # Textiles
    "Textilier - Partihandel",  # Textiles
    "Textilier - Produktion",  # Textiles
    "Textilmaskiner, konfektionsmaskiner",  # Textile machinery
    "Textilbehandling",  # Textile processing
    "Läder och lädervaror - tillverkning",  # Leather goods
    "Läder, skor, inredning, reseeffekter och textilier",  # Leather goods
    "Skinn, läder och pälsvaror - grossister",  # Leather goods
    "Möbler",  # Furniture
    "Möbler - Produktion",  # Furniture
    "Möbler, hushållsartiklar och järnvaror - agentur",  # Furniture
    "Köksinredningar",  # Kitchen furniture
    "Köksinredningar - agentur och grossist",  # Kitchen furniture
    "Badrumsinredningar, badrumsrenoveringar",  # Bathroom furniture
    "Golvbeläggningar",  # Flooring
    "Tapeter",  # Wallpaper
    "Färger, lacker, tapeter",  # Paint
    "Färger, lacker, tapeter - tillverkning",  # Paint
    "Måleriarbeten",  # Painting
    "Glas, glasvaror",  # Glass
    "Glasarbeten",  # Glass work
    "Kakel - tillverkning",  # Tiles
    "Takarbeten",  # Roofing
    "Undertak, undertaksarbeten",  # Ceiling
    "Fasadbehandling",  # Facade
    "Solskydd",  # Sun protection
    "Balkonger",  # Balconies
    "Trappor",  # Stairs
    "Dörrar, portar",  # Doors
    "Fönster",  # Windows
    "Stängsel, stängselnät",  # Fencing
    "Ställningar",  # Scaffolding
    "Rivningsarbeten",  # Demolition
    "Sprängningsarbeten",  # Blasting
    "Stenarbeten",  # Stone work
    "Borrningsarbeten",  # Drilling
    "Markentreprenörer, anläggningsentreprenörer",  # Construction
    "Byggentreprenader-Infrastruktur",  # Construction
    "Byggmaterial",  # Construction materials
    "Byggmästare",  # Construction
    "Entreprenörer",  # Construction
    "Entreprenadmaskiner",  # Construction equipment
    "Entreprenadmaskinsarbeten",  # Construction work
    "Trä och byggvaror - grossist",  # Construction materials
    "Trävaror",  # Wood products
    "Trävaror - produktion",  # Wood products
    "Träbearbetningsutrustningar",  # Wood processing
    "Sågverk",  # Sawmills
    "Snickeriarbeten",  # Carpentry
    "Betong, betongvaror",  # Concrete
    "Eldfast material",  # Refractory materials
    "Isoleringsmaterial",  # Insulation
    "VVS-arbeten, material och produkter",  # Plumbing
    "Elinstallationer",  # Electrical
    "Elmaterial - reparationer",  # Electrical
    "Elmateriel",  # Electrical
    "Elmotorer, generatorer",  # Electrical
    "Ventiler, kopplingar",  # Valves
    "Rör, rördelar",  # Pipes
    "Rörarbeten",  # Pipe work
    "Pumpar",  # Pumps
    "Värmepumpar, värmeväxlare",  # Heat pumps
    "Kyl-, frysanläggningar - tillverkning",  # Cooling
    "Kylanläggningar, frysanläggningar",  # Cooling
    "Ugnar",  # Ovens
    "Värmebehandling, härdning",  # Heat treatment
    "Tryckluftsutrustningar",  # Air compressors
    "Hydraulik",  # Hydraulics
    "Lyftanordningar, lyftutrustningar",  # Lifting equipment
    "Truckar",  # Forklifts
    "Lastning och lossning",  # Loading
    "Lager",  # Warehousing
    "Spedition",  # Freight
    "Kurirverksamhet",  # Courier
    "Budservice",  # Delivery
    "Postorder/e-handel",  # E-commerce
    "E-handel",  # E-commerce
    "Direktmarknadsföring",  # Direct marketing
    "Medieförmedling",  # Media
    "Medieförmedling, -reklamförsäljning",  # Media
    "Reklambyråer",  # Advertising
    "Marknadsföringskonsulter",  # Marketing
    "Företagsprofilering",  # Business profiling
    "Fotografer",  # Photography
    "Fotoutrustningar",  # Photography equipment
    "Ljudanläggningar, ljusanläggningar, bildanläggningar",  # AV equipment
    "Ljudproduktion, musikproduktion",  # Audio production
    "Radio, TV-programbolag",  # Broadcasting
    "Evenemangsproduktioner",  # Event production
    "Konferensarrangörer",  # Conference organizers
    "Konferenslokaler, kurslokaler, konferensgårdar",  # Conference venues
    "Museer",  # Museums
    "Historiska minnesmärken och byggnader",  # Historical monuments
    "Bibliotek- och arkivverksamhet",  # Libraries
    "Kulturskolor och undervisning",  # Cultural schools
    "Fackskolor",  # Trade schools
    "Högskolor, universitet",  # Universities
    "Förskolor",  # Preschools
    "Trafikskolor",  # Traffic schools
    "Utbildning",  # Education
    "Forskning",  # Research
    "Laboratorieanalyser",  # Laboratory analysis
    "Medicinteknisk utrustning",  # Medical equipment
    "Medicinteknisk utrustning - produktion",  # Medical equipment
    "Läkemedel",  # Pharmaceuticals
    "Apoteksvaror, läkemedel - Distribution",  # Pharmaceuticals
    "Apoteksvaror, läkemedel - Partihandel",  # Pharmaceuticals
    "Bioteknik",  # Biotechnology
    "Fodermedel",  # Animal feed
    "Gödningsmedel",  # Fertilizers
    "Kemikalier, industrikemikalier",  # Chemicals
    "Kemikalier, industrikemikalier - tillverkning",  # Chemicals
    "Kemikalier, industrikemikaleier - grossist",  # Chemicals
    "Kemiska, kemisk-tekniska produkter",  # Chemical products
    "Kol- och raffinerade petroleumprodukter - tillverkning",  # Petroleum
    "Bränsle - grossist och detaljist",  # Fuel
    "Bensinstationer",  # Gas stations
    "Gasproduktion",  # Gas production
    "Gaser, utrustningar",  # Gas equipment
    "Energiförsörjning",  # Energy supply
    "Energihandel",  # Energy trading
    "Fjärrvärme",  # District heating
    "Bioenergi",  # Bioenergy
    "Energieffektivisering",  # Energy efficiency
    "Miljöteknik",  # Environmental technology
    "Miljövård, miljökonsulter",  # Environmental consulting
    "Avfallshantering",  # Waste management
    "Renhållningsentreprenörer, avfallshantering",  # Waste management
    "Väganordningar, trafikanordningar, vägarbeten",  # Road works
    "Hamnar",  # Ports
    "Sjöentreprenader",  # Marine construction
    "Skeppsklarerare, skeppsmäklare",  # Shipping
    "Containrar",  # Containers
    "Paketering",  # Packaging
    "Förpackningar",  # Packaging
    "Förpackningar - Transportförpackningar",  # Packaging
    "Förpackningsmaskiner",  # Packaging machines
    "Etiketter, etikettutrustningar",  # Labels
    "Pappersvaror - Partihandel",  # Paper products
    "Pappersvaror - Produktion",  # Paper products
    "Pappersindustrimaskiner",  # Paper machines
    "Böcker, papper, tidningar och reklamblad",  # Books and paper
    "Bokbinderier",  # Bookbinding
    "Förlagsbyråer",  # Publishing
    "Antikviteter",  # Antiques
    "Auktioner",  # Auctions
    "Begravningsbyråer och krematorier",  # Funeral services
    "Föreningar",  # Associations
    "Organisationer",  # Organizations
    "Idrottslag och klubbar",  # Sports clubs
    "Nöjesparker",  # Amusement parks
    "Privat tjänsteutövning",  # Private services
    "Bostäder",  # Housing
    "Hus",  # Houses
    "Spel, nöjesanläggningsutrustningar",  # Gaming equipment
    "Torghandel",  # Market trade
    "Fruktleveranser, vattenleveranser",  # Fruit delivery
    "Jordbruk - andra tjänster",  # Agriculture
    "Jordbruk - boskap och djurhållning",  # Agriculture
    "Jordbruk - mjölkproduktion",  # Agriculture
    "Jordbruk - odling",  # Agriculture
    "Bilreparationer",  # Car repairs
    "Boskap",  # Livestock
    "Grisuppfödning",  # Pig farming
    "Levande djur",  # Live animals
    "Motorbanor",  # Race tracks
    "Konstnärer",  # Artists
    "Musik",  # Music
    "Musikinstrument",  # Musical instruments
    "Tidningar",  # Newspapers
    "Nyhetsservice och telegrambyråer"  # News services
]

# Connect to database
engine = create_engine('sqlite:///allabolag.db')

# Read the data
df = pd.read_sql('SELECT * FROM filtered_candidates', engine)

# Print initial count
print(f"Initial number of companies: {len(df)}")

# Convert numeric columns
df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce')
df['profit'] = pd.to_numeric(df['profit'], errors='coerce')
df['employees'] = pd.to_numeric(df['employees'], errors='coerce')

# Convert incorporation_date to datetime
df['incorporation_date'] = pd.to_datetime(df['incorporation_date'], format='%d.%m.%Y', errors='coerce')

# Calculate company age
current_year = datetime.datetime.now().year
df['company_age'] = current_year - df['incorporation_date'].dt.year

# Apply filters
filtered_df = df[
    # Sector filters
    (~df['segment_name'].isin(ADDITIONAL_EXCLUDE_SECTORS)) &
    
    # Financial filters
    (df['revenue'] >= 50000) &  # Minimum revenue 50,000 SEK
    (df['profit'] >= 5000) &    # Minimum profit 5,000 SEK
    
    # Company maturity filters
    (df['company_age'] >= 3) &  # At least 3 years old
    (df['employees'] >= 2)      # At least 2 employees
]

# Exclude companies with 'Advokat' in the name (case-insensitive)
filtered_df = filtered_df[~filtered_df['name'].str.contains('advokat', case=False, na=False)]

# Print filtered count after lawyer exclusion
print(f"Number of companies after excluding lawyers: {len(filtered_df)}")

# Save filtered companies to new table
filtered_df.to_sql('high_potential_candidates', engine, if_exists='replace', index=False)

# Print summary of remaining sectors
print("\nRemaining sectors after filtering:")
remaining_sectors = filtered_df['segment_name'].dropna().unique()
for sector in sorted(remaining_sectors):
    print(sector)

# Print some statistics
print("\nStatistics for filtered companies:")
print(f"Average revenue: {filtered_df['revenue'].mean():,.2f} SEK")
print(f"Average profit: {filtered_df['profit'].mean():,.2f} SEK")
print(f"Average company age: {filtered_df['company_age'].mean():.1f} years")
print(f"Average employees: {filtered_df['employees'].mean():.1f}")

# Print distribution of companies by sector
print("\nTop 10 sectors by number of companies:")
sector_counts = filtered_df['segment_name'].value_counts().head(10)
for sector, count in sector_counts.items():
    print(f"{sector}: {count} companies") 