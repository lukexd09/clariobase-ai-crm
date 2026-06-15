param(
  [Parameter(Mandatory = $true)]
  [string]$RunnerRoot,

  [Parameter(Mandatory = $true)]
  [string]$RunnerWorkDir,

  [Parameter(Mandatory = $true)]
  [string]$ProductionCheckout,

  [switch]$DryRun
)

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

$result = [ordered]@{
  status = "PASS"
  runnerRoot = (Resolve-NormalizedPath $RunnerRoot)
  runnerWorkDir = (Resolve-NormalizedPath $RunnerWorkDir)
  productionCheckout = (Resolve-NormalizedPath $ProductionCheckout)
  dockerVersion = $dockerVersion
  gitVersion = $gitVersion
  nodeVersion = $nodeVersion
  dryRun = [bool]$DryRun
}

$result | ConvertTo-Json -Depth 4
