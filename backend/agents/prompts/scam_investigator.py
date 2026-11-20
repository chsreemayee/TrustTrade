"""Prompts for the Scam Investigator (PRD 6.1 steps 1 and 5). The LLM extracts and explains only."""

EXTRACT_PROMPT = """You read messages that people in India receive about money or investments.
Extract facts only. Do not judge whether it is a scam.

Rules:
- Copy details exactly as written. If something is not in the message, use null, false or [].
- "message_text": the full message text. For an image, transcribe all visible text.
- "promised_return_percent" and "promised_return_period_days": only if a number is stated
  (e.g. "20% monthly" -> 20 and 30; "double in 7 days" -> 100 and 7).
- "amount_asked_rupees": money the reader is asked to send/pay/invest.
  "amount_promised_back_rupees": money the reader is told they will get back.
- "sebi_registration_claimed": true only if the sender says THEY are SEBI-registered.
- "uses_famous_or_official_name": the celebrity, SEBI, NSE, bank or broker name used to promote
  an offer or ask for money. null for a plain notification sent by that organisation itself.
- "sender_is_unknown_number": true only if the message or the user says it came from an
  unknown number; otherwise null.
- "shows_profit_screenshots": true only if it shows or mentions screenshots of profits.
- "official_claim_with_spelling_mistakes": true only if it claims to be official AND has clear
  spelling mistakes.

{input_block}
"""

EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "message_text": {"type": "string"},
        "language": {"type": "string", "enum": ["te", "hi", "en", "kn", "ta", "ml", "other"]},
        "sender_claim": {"type": "string", "nullable": True},
        "promised_return_text": {"type": "string", "nullable": True},
        "promised_return_percent": {"type": "number", "nullable": True},
        "promised_return_period_days": {"type": "number", "nullable": True},
        "amount_asked": {"type": "string", "nullable": True},
        "amount_asked_rupees": {"type": "number", "nullable": True},
        "amount_promised_back_rupees": {"type": "number", "nullable": True},
        "payment_method": {"type": "string", "nullable": True},
        "upi_ids": {"type": "array", "items": {"type": "string"}},
        "links": {"type": "array", "items": {"type": "string"}},
        "phone_numbers": {"type": "array", "items": {"type": "string"}},
        "app_names": {"type": "array", "items": {"type": "string"}},
        "company_or_stock": {"type": "string", "nullable": True},
        "sebi_registration_claimed": {"type": "boolean"},
        "sebi_registration_number": {"type": "string", "nullable": True},
        "registered_entity_name": {"type": "string", "nullable": True},
        "claims_fixed_or_assured_return": {"type": "boolean"},
        "uses_famous_or_official_name": {"type": "string", "nullable": True},
        "asks_joining_fee": {"type": "boolean"},
        "shows_profit_screenshots": {"type": "boolean"},
        "sender_is_unknown_number": {"type": "boolean", "nullable": True},
        "official_claim_with_spelling_mistakes": {"type": "boolean"},
    },
    "required": ["message_text", "language", "upi_ids", "links", "sebi_registration_claimed",
                 "claims_fixed_or_assured_return", "asks_joining_fee", "shows_profit_screenshots",
                 "official_claim_with_spelling_mistakes"],
}

EXPLAIN_PROMPT = """You explain a scam-check result to an adult in India who reads little.
The result is already decided; do not change it or add new warning signs.

Result: {verdict_label}
{always_line}Warning signs found (with source):
{signs_block}
Checks that could not run: {not_checked}

Write one short explanation in EACH of these languages: te (Telugu), hi (Hindi), en (English),
kn (Kannada), ta (Tamil), ml (Malayalam).
- At most 40 words each. Simple everyday words, like a helpful elder sister.
- Name the source of each warning sign (for example "TrustTrade rules", "SEBI list").
- Never say the tip or offer is safe, genuine, 100% or guaranteed.
- Never tell the reader to buy, sell or invest in anything.
- Do not add phone numbers or links. Do not end with advice; that is added separately.
"""

EXPLAIN_SCHEMA = {
    "type": "object",
    "properties": {lang: {"type": "string"} for lang in ("te", "hi", "en", "kn", "ta", "ml")},
    "required": ["te", "hi", "en", "kn", "ta", "ml"],
}
