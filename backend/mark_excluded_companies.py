import sqlite3
import json

DB_PATH = "allabolag.db"
TABLE_NAME = "segmentation_companies_raw"

EXCLUDE_NACE_KEYWORDS = [
    "Uthyrning och förvaltning", "Fastighetsförvaltning", "Handel med egna fastigheter",
    "Förvaltning av och handel med värdepapper", "Investment- och riskkapitalbolagsverksamhet",
    "Holdingverksamhet", "Personalutbildning", "Gymnasial yrkesutbildning", "Förskoleutbildning",
    "Grundskoleutbildning", "Öppna sociala insatser", "Odling", "Mjölkproduktion", "Skogsförvaltning",
    "Verksamhet i andra intresseorganisationer", "Allmännyttiga anläggningsarbeten",
    "Specialiserad butikshandel", "Apotekshandel", "Butikshandel", "Uthyrning och leasing",
    "Arbetsförmedling", "Callcenterverksamhet", "Magasinering", "Städning", "Lokalvård"
]
EXCEPTION_NACE = "Uthyrning och leasing av bygg- och anläggningsmaskiner"

def add_exclude_column_if_missing(conn):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({TABLE_NAME})")
    columns = [row[1] for row in cur.fetchall()]
    if 'exclude' not in columns:
        cur.execute(f"ALTER TABLE {TABLE_NAME} ADD COLUMN exclude INTEGER DEFAULT 0")
        conn.commit()

def mark_excluded_companies(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT rowid, naceCategories FROM {TABLE_NAME}")
    updates = []
    for rowid, nace_json in cur.fetchall():
        try:
            nace_cats = json.loads(nace_json)
        except Exception:
            nace_cats = []
        # Always keep if exception present
        if any(EXCEPTION_NACE in nc for nc in nace_cats):
            exclude = 0
        elif any(any(excl in nc for excl in EXCLUDE_NACE_KEYWORDS) for nc in nace_cats):
            exclude = 1
        else:
            exclude = 0
        updates.append((exclude, rowid))
    cur.executemany(f"UPDATE {TABLE_NAME} SET exclude = ? WHERE rowid = ?", updates)
    conn.commit()

def main():
    conn = sqlite3.connect(DB_PATH)
    add_exclude_column_if_missing(conn)
    mark_excluded_companies(conn)
    print("Exclusion marking complete.")
    conn.close()

if __name__ == "__main__":
    main() 