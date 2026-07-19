param(
  [Parameter(Mandatory = $true)]
  [string]$RequestedRef,

  [string]$SourceMode = "unknown",

  [string]$ResolvedSha,

  [string]$DatabaseMode = "preserve",

  [string]$ResetConfirmation,

  [string]$ControlCheckoutPath = ".",

  [string]$SourceCheckoutPath,

  [string]$PreviewEnvFile = ".env.compose.preview.local",

  [int]$TimeoutSeconds = 180,

  [switch]$DryRun
)

$args = @(
  "./node_modules/tsx/dist/cli.mjs",
  "scripts/deploy-preview.ts",
  "--source-mode",
  $SourceMode,
  "--requested-ref",
  $RequestedRef,
  "--database-mode",
  $DatabaseMode,
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

if ($ResetConfirmation) {
  $args += @("--reset-confirmation", $ResetConfirmation)
}

if ($ResolvedSha) {
  $args += @("--resolved-sha", $ResolvedSha)
}

if ($DryRun) {
  $args += "--dry-run"
}

$output = node @args
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0 -and $env:GITHUB_OUTPUT) {
  try {
    $payload = ($output -join "`n") | ConvertFrom-Json
    if ($null -ne $payload.previewUrl) {
      "preview_url=$($payload.previewUrl)" | Out-File -FilePath $env:GITHUB_OUTPUT -Append
    }
  } catch {
    Write-Warning "Unable to parse deploy preview JSON output for preview_url export."
  }
}

$output
exit $exitCode
