param(
  [string]$RequestedRef = "stop-preview",

  [string]$ResolvedSha,

  [string]$PreviewEnvFile = ".env.compose.preview.local",

  [switch]$DryRun
)

$args = @(
  "./node_modules/tsx/dist/cli.mjs",
  "scripts/stop-preview.ts",
  "--requested-ref",
  $RequestedRef,
  "--preview-env-file",
  $PreviewEnvFile
)

if ($ResolvedSha) {
  $args += @("--resolved-sha", $ResolvedSha)
}

if ($DryRun) {
  $args += "--dry-run"
}

node @args
exit $LASTEXITCODE
