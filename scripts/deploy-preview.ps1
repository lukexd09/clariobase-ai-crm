param(
  [Parameter(Mandatory = $true)]
  [string]$RequestedRef,

  [string]$ResolvedSha,

  [string]$ControlCheckoutPath = ".",

  [string]$SourceCheckoutPath,

  [string]$PreviewEnvFile = ".env.compose.preview.local",

  [int]$TimeoutSeconds = 180,

  [switch]$DryRun
)

$args = @(
  "./node_modules/tsx/dist/cli.mjs",
  "scripts/deploy-preview.ts",
  "--requested-ref",
  $RequestedRef,
  "--control-checkout-path",
  $ControlCheckoutPath,
  "--preview-env-file",
  $PreviewEnvFile,
  "--timeout-seconds",
  $TimeoutSeconds
)

if ($SourceCheckoutPath) {
  $args += @("--source-checkout-path", $SourceCheckoutPath)
}

if ($ResolvedSha) {
  $args += @("--resolved-sha", $ResolvedSha)
}

if ($DryRun) {
  $args += "--dry-run"
}

node @args
exit $LASTEXITCODE
