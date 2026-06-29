# E016.T012 Stop Preview fix

This branch fixes the Stop Preview interpolation failure found in workflow run `28372569702`.

The fix is limited to a stop-only placeholder image reference and a regression test that removes any inherited `CRM_PREVIEW_IMAGE_REF` before resolving the Compose model.

No product behavior, production resources, preview deployment workflow, or PR #112 is changed.
