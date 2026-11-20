"""Orchestrator intent prompt (PRD 9). Used only when the code rules can't tell."""

ROUTE_PROMPT = """Classify what this person said to a money-safety app in India.

Routes:
- scam_check: they describe or paste a tip, offer or message someone sent them
- stock_pick: they ask which share/stock/fund to buy, sell or pick
- money_question: a question about money basics (saving, prices, shares, banks, risk, starting safely)
- off_topic: anything else

Said: \"\"\"{text}\"\"\"
"""

ROUTE_SCHEMA = {
    "type": "object",
    "properties": {"route": {"type": "string", "enum": ["scam_check", "stock_pick", "money_question", "off_topic"]}},
    "required": ["route"],
}
