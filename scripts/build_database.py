#!/usr/bin/env python3
"""
Build the SQLite database from the four credit union dataset repos.

Expects the following repos to be cloned as siblings in the working directory:
  credit-union-ncua/
  credit-union-websites/
  credit-union-membership/
  credit-union-hysa/
"""

import csv
import os
import sqlite3
import sys

DB_FILE = "beautiful_data.db"

# Paths to CSV files (relative to the working directory)
NCUA_CSV = "credit-union-ncua/data/raw/ncua.gov/FederallyInsuredCreditUnions_2025q3.csv"
WEBSITES_CSV = "credit-union-websites/data/processed/scraped-websites.csv"
MEMBERSHIP_CSV = "credit-union-membership/data/membership.csv"
HYSA_CSV = "credit-union-hysa/data/hysa.csv"


def load_from_ncua(conn, csv_path):
    """
    Load a curated subset of NCUA data into the ncua_ table.

    Note: The full NCUA dataset contains 25+ columns of financial and
    administrative data per credit union. We intentionally load only the
    columns required by the website frontend (charter number, name, city,
    and state) to keep the database lightweight and query performance fast.
    The complete NCUA dataset is available in the credit-union-ncua repo
    for any downstream analysis that requires the full data.
    """
    conn.execute("""
        CREATE TABLE ncua_ (
            charter_number INTEGER PRIMARY KEY,
            credit_union_name TEXT NOT NULL,
            city TEXT,
            state TEXT
        )
    """)

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append((
                int(row["Charter number"]),
                row["Credit Union name"],
                row["City \n(Mailing address)"],
                row["State (Mailing address)"],
            ))
    conn.executemany(
        "INSERT INTO ncua_ VALUES (?, ?, ?, ?)", rows
    )
    print(f"  ncua_: {len(rows)} rows loaded")


def load_website(conn, csv_path):
    """Load website data into the website table."""
    conn.execute("""
        CREATE TABLE website (
            charter_number INTEGER PRIMARY KEY,
            url TEXT,
            scraped_timestamp TEXT
        )
    """)

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append((
                int(row["charter_number"]),
                row["website"],
                row["scraped_timestamp"],
            ))
    conn.executemany(
        "INSERT INTO website VALUES (?, ?, ?)", rows
    )
    print(f"  website: {len(rows)} rows loaded")


def load_membership(conn, csv_path):
    """Load membership data into the membership table."""
    conn.execute("""
        CREATE TABLE membership (
            charter_number INTEGER PRIMARY KEY,
            membership_eligibility TEXT,
            membership_field TEXT,
            membership_url TEXT,
            timestamp TEXT,
            membership_notes TEXT
        )
    """)

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append((
                int(row["charter"]),
                row["membership_eligibility"],
                row["membership_field"],
                row["membership_url"],
                row["timestamp"],
                row["membership_notes"],
            ))
    conn.executemany(
        "INSERT INTO membership VALUES (?, ?, ?, ?, ?, ?)", rows
    )
    print(f"  membership: {len(rows)} rows loaded")


def load_hysa(conn, csv_path):
    """Load HYSA rates into the hysa table."""
    conn.execute("""
        CREATE TABLE hysa (
            charter_number INTEGER PRIMARY KEY,
            product TEXT,
            url TEXT,
            apy TEXT,
            min_balance TEXT,
            max_balance TEXT,
            last_updated TEXT
        )
    """)

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append((
                int(row["charter_number"]),
                row["product"],
                row["url"],
                row["apy"],
                row["min_balance"],
                row["max_balance"],
                row["last_updated"],
            ))
    conn.executemany(
        "INSERT INTO hysa VALUES (?, ?, ?, ?, ?, ?, ?)", rows
    )
    print(f"  hysa: {len(rows)} rows loaded")


def main():
    work_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    # Resolve CSV paths relative to work_dir
    ncua_path = os.path.join(work_dir, NCUA_CSV)
    websites_path = os.path.join(work_dir, WEBSITES_CSV)
    membership_path = os.path.join(work_dir, MEMBERSHIP_CSV)
    hysa_path = os.path.join(work_dir, HYSA_CSV)

    # Verify all CSVs exist before starting
    for name, path in [("NCUA", ncua_path), ("Websites", websites_path),
                        ("Membership", membership_path), ("HYSA", hysa_path)]:
        if not os.path.exists(path):
            print(f"ERROR: {name} CSV not found at {path}", file=sys.stderr)
            sys.exit(1)

    db_path = os.path.join(work_dir, DB_FILE)

    # Remove existing database to rebuild from scratch
    if os.path.exists(db_path):
        os.remove(db_path)

    print(f"Building {db_path} ...")
    conn = sqlite3.connect(db_path)
    try:
        load_from_ncua(conn, ncua_path)
        load_website(conn, websites_path)
        load_membership(conn, membership_path)
        load_hysa(conn, hysa_path)
        conn.commit()
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
