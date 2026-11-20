"""A stand-in for Gemini: returns what a correct extraction of each demo tip looks like."""
from core.llm import LLMError

BASE = {"language": "en", "sender_claim": None, "promised_return_text": None, "promised_return_percent": None,
        "promised_return_period_days": None, "amount_asked": None, "amount_asked_rupees": None,
        "amount_promised_back_rupees": None, "payment_method": None, "upi_ids": [], "links": [],
        "phone_numbers": [], "app_names": [], "company_or_stock": None, "sebi_registration_claimed": False,
        "sebi_registration_number": None, "registered_entity_name": None,
        "claims_fixed_or_assured_return": False, "uses_famous_or_official_name": None,
        "asks_joining_fee": False, "shows_profit_screenshots": False, "sender_is_unknown_number": None,
        "official_claim_with_spelling_mistakes": False}

# Keyed by a marker that appears in both the English and Telugu versions of each tip.
EXTRACTS = {
    "rahulprofits@ybl": dict(sender_claim="VIP WhatsApp group", promised_return_text="20% monthly",
                             promised_return_percent=20, promised_return_period_days=30, amount_asked="₹999",
                             amount_asked_rupees=999, payment_method="UPI", upi_ids=["rahulprofits@ybl"],
                             claims_fixed_or_assured_return=True, asks_joining_fee=True),
    "10,000": dict(promised_return_text="₹10,000 back in 7 days", promised_return_percent=100,
                   promised_return_period_days=7, amount_asked="₹5,000", amount_asked_rupees=5000,
                   amount_promised_back_rupees=10000),
    "xx-trade.apk": dict(links=["bit.ly/xx-trade.apk"], app_names=["trading app"], promised_return_text="₹2,000 bonus"),
    "12345": dict(sender_claim="Mutual fund SIP", amount_asked="₹500", payment_method="SIP debit"),
}
INSIDER = dict(sender_claim="cousin", company_or_stock="a small share", promised_return_text="will go up a lot")


class FakeLLM:
    def __init__(self, explain_bodies: dict | None = None, extract_overrides: dict | None = None):
        self.calls: list[str] = []
        self.explain_bodies = explain_bodies
        self.extract_overrides = extract_overrides or {}
        self.last_image: bytes | None = None

    def generate_json(self, prompt, schema, *, image=None, image_mime=None, timeout_ms=6000):
        if "message_text" in schema["properties"]:
            self.calls.append("extract")
            self.last_image = image
            msg = prompt.split('"""')[1].strip() if '"""' in prompt else ""
            out = dict(BASE, message_text=msg)
            for marker, fields in EXTRACTS.items():
                if marker in msg:
                    out.update(fields)
            if "insider" in msg.lower() or "ఇన్" in msg:
                out.update(INSIDER)
            out.update(self.extract_overrides)
            return out
        self.calls.append("explain")
        if self.explain_bodies is not None:
            return self.explain_bodies
        return {lang: "Short plain explanation naming TrustTrade rules." for lang in ("te", "hi", "en", "kn", "ta", "ml")}


class BrokenLLM:
    """Every call fails, like a timeout or quota error."""
    def generate_json(self, *a, **k):
        raise LLMError("Timeout")
