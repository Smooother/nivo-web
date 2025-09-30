import pandas as pd
from sqlalchemy import create_engine

DB_PATH = "allabolag.db"
TABLE_IN = "new_segmented_companies"
TABLE_OUT = "digitizable_ecommerce_and_product_companies"

# List of keywords relevant for e-commerce and product businesses.
KEYWORDS = [
    "e-handel", "ehandel", "e-commerce", "postorder", "detaljhandel",
    "butikshandel", "livsmedel", "handel", "produkt", "tillverkning",
    "förpackning", "grossist", "agentur", "butik", "webbshop", "online",
    "distribution", "lager", "leverans"
]

def matches_segment(segment_name):
    seg = str(segment_name).lower()
    return any(keyword in seg for keyword in KEYWORDS)

def main():
    engine = create_engine(f"sqlite:///{DB_PATH}")
    df = pd.read_sql(f"SELECT * FROM {TABLE_IN}", engine)
    # Apply keyword matching on the segment_name column
    df_selected = df[df["segment_name"].apply(matches_segment)]
    print(f"Selected {len(df_selected)} companies matching e-commerce/product criteria.")
    df_selected.to_sql(TABLE_OUT, engine, if_exists="replace", index=False)
    print(f"Saved results to new table '{TABLE_OUT}'.")

if __name__ == "__main__":
    main()