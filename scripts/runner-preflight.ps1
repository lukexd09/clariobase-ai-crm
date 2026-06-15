param(
  [Parameter(Mandatory = $true)]
  [string]$RunnerRoot,

  [Parameter(Mandatory = $true)]
  [string]$RunnerWorkDir,

  [Parameter(Mandatory = $true)]
  [string]$ProductionCheckout,

  [switch]$DryRun
)

$MinimumRunnerVersion = [version]"2.327.1"

function Resolve-NormalizedPath {
  param([string]$PathValue)

  return [System.IO.Path]::GetFullPath($PathValue).TrimEnd('\')
}

function Assert-SeparatePath {
  param(
    [string]$Candidate,
    [string]$Protected,
    [string]$Label
  )

  $candidatePath = Resolve-NormalizedPath $Candidate
  $protectedPath = Resolve-NormalizedPath $Protected

  if ($candidatePath -eq $protectedPath) {
    throw "$Label must not equal the protected production checkout path $protectedPath."
  }

  if ($candidatePath.StartsWith("$protectedPath\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "$Label must stay outside the protected production checkout path $protectedPath."
  }
}

Assert-SeparatePath -Candidate $RunnerRoot -Protected $ProductionCheckout -Label "Runner root"
Assert-SeparatePath -Candidate $RunnerWorkDir -Protected $ProductionCheckout -Label "Runner work directory"

$dockerVersion = docker version --format '{{.Server.Version}}'
$gitVersion = git --version
$nodeVersion = node --version

if (-not $DryRun) {
  docker info | Out-Null
}

$runnerListener = Join-Path $RunnerRoot "bin\Runner.Listener.exe"
$runnerVersion = [version]"0.0.0"

if (Test-Path $runnerListener) {
  $runnerVersionInfo = (Get-Item $runnerListener).VersionInfo
  $runnerVersionText = $runnerVersionInfo.FileVersion

  if (-not $runnerVersionText) {
    $runnerVersionText = $runnerVersionInfo.ProductVersion
  }

  if ($runnerVersionText) {
    $runnerVersion = [version]($runnerVersionText.Split('+')[0])
  }
}

if ($runnerVersion -lt $MinimumRunnerVersion) {
  throw "GitHub Actions runner version $runnerVersion is too old. Minimum supported version for Node.js 24-compatible actions is $MinimumRunnerVersion."
}

$result = [ordered]@{
  status = "PASS"
  runnerRoot = (Resolve-NormalizedPath $RunnerRoot)
  runnerWorkDir = (Resolve-NormalizedPath $RunnerWorkDir)
  productionCheckout = (Resolve-NormalizedPath $ProductionCheckout)
  dockerVersion = $dockerVersion
  gitVersion = $gitVersion
  nodeVersion = $nodeVersion
  runnerVersion = $runnerVersion.ToString()
  minimumRunnerVersion = $MinimumRunnerVersion.ToString()
  dryRun = [bool]$DryRun
}

$result | ConvertTo-Json -Depth 4
