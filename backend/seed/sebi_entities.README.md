# SEBI registered intermediaries

No rows are seeded on purpose. A made-up "registered" entity could make a scammer look
legitimate, so the SEBI check reports **could not check** until the real list is loaded.

Load the real list (exported from sebi.gov.in → Intermediaries) with:

    python scripts/load_sebi_csv.py path/to/sebi_export.csv

or through the admin Data screen (step 5). Required columns:
registration_no,name,category,valid_from,valid_to
