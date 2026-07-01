param(
  [string]$RequestedRef = "stop-preview",

  [string]$ResolvedSha,

  [string]$DatabaseMode = "preserve",

  [string]$ResetConfirmation,

  [string]$ControlCheckoutPath = ".",

  [switch]$DryRun
)

$args = @(
  "./node_modules/tsx/dist/cli.mjs",
  "scripts/stop-preview.ts",
  "--requested-ref",
  $RequestedRef,
  "--database-mode",
  $DatabaseMode,
  "--control-checkout-path",
  $ControlCheckoutPath
)

if ($ResetConfirmation) {
  $args += @("--reset-confirmation", $ResetConfirmation)
}

if ($ResolvedSha) {
  $args += @("--resolved-sha", $ResolvedSha)
}

if ($DryRun) {
  $args += "--dry-run"
}

node @args
exit $LASTEXITCODE
