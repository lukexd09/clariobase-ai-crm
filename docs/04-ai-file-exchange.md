# AI File Exchange

## Goal

The CRM must support manual ChatGPT collaboration without calling external AI APIs in v1.

The exchange is file-based:

```text
CRM export → ChatGPT analysis → structured response → CRM import preview → user approval → apply changes
```

## Folder structure

```text
ai_exchange/
├── inbox/       # CRM-generated files for ChatGPT review
├── outbox/      # ChatGPT-generated files ready for CRM import
├── processed/   # Archived files after successful import
├── rejected/    # Invalid, unsafe or rejected responses
├── schemas/     # JSON schemas for file contracts
└── samples/     # Safe anonymized examples
```

## Important rule

Real lead data should not be committed to the repository by default. The repository should contain schemas and anonymized samples. Real exports can live locally in the same folder structure.
