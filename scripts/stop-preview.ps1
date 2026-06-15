param(
  [string]$RequestedRef = "stop-preview",

  [string]$ResolvedSha,

  [string]$ControlCheckoutPath = ".",

  [switch]$DryRun
)

$args = @(
  "./node_modules/tsx/dist/cli.mjs",
  "scripts/stop-preview.ts",
  "--requested-ref",
  $RequestedRef,
  "--control-checkout-path",
  $ControlCheckoutPath
)

if ($ResolvedSha) {
  $args += @("--resolved-sha", $ResolvedSha)
}

if ($DryRun) {
  $args += "--dry-run"
}

node @args
exit $LASTEXITCODE
