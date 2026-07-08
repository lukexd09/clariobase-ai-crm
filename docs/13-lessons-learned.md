# Lessons learned

This document records practical lessons discovered while developing ClarioBase AI CRM. Entries should describe the observed symptom, the evidence used to identify the root cause, the applied fix, and the safe reusable procedure.

## 2026-07-02 — Microsoft Defender can bottleneck Codex file-heavy workflows on Windows

### Context

Environment:

- Windows local development machine,
- Codex working intensively in the repository,
- pnpm and Next.js-generated files,
- Microsoft Defender real-time protection enabled.

### Symptom

During a file-heavy Codex task:

- total CPU usage reached approximately 100%,
- `Antimalware Service Executable` consumed roughly 40–50% CPU,
- Codex operations involving dependency stores, temporary workspaces, builds, or many small files became noticeably slower.

### Investigation

Use Microsoft Defender's built-in performance recorder from an elevated PowerShell session:

```powershell
New-MpPerformanceRecording `
    -RecordTo "$env:USERPROFILE\Desktop\defender-codex.etl"
```

While recording, run a representative Codex task for a few minutes, then stop the recording and generate a report:

```powershell
Get-MpPerformanceReport `
    -Path "$env:USERPROFILE\Desktop\defender-codex.etl" `
    -TopPaths 15 `
    -TopFiles 15 `
    -TopProcesses 15
```

### Finding

The report showed that nearly all expensive scans came from a Codex-generated temporary directory inside the repository:

```text
<repo>\.codex-tmp\<task-bundle>\pnpm-store\...
<repo>\.codex-tmp\<task-bundle>\workspace\node_modules\...
```

The existing exclusion for the repository's top-level `node_modules` directory did not cover nested copies created under `.codex-tmp`.

The process table also showed high activity attributed to `dllhost.exe`, but the path evidence pointed to `.codex-tmp` as the actual narrow target. Excluding the system process would have been much broader and less safe.

### Applied fix

Add precise Microsoft Defender exclusions for generated, high-churn directories only.

Run PowerShell as Administrator:

```powershell
$repo = "C:\Serwer\Projekty\Clariobase\clariobase-ai-crm"

$paths = @(
    "$repo\.git",
    "$repo\node_modules",
    "$repo\.next",
    "$repo\.codex-tmp",
    "$repo\dist",
    "$repo\build",
    "$repo\coverage",
    "$repo\.turbo",
    "$repo\.cache",
    "$repo\.venv",
    "$repo\venv"
)

$paths |
    Where-Object { Test-Path $_ } |
    ForEach-Object {
        Add-MpPreference -ExclusionPath $_
        Write-Host "Added Defender exclusion: $_"
    }
```

Important: `Where-Object { Test-Path $_ }` adds only directories that currently exist. If Codex creates `.codex-tmp` later, add it explicitly:

```powershell
Add-MpPreference -ExclusionPath "$repo\.codex-tmp"
```

### Verification

List the exclusions that apply to the repository:

```powershell
(Get-MpPreference).ExclusionPath |
    Where-Object { $_ -like "$repo*" }
```

Then repeat a representative Codex task and observe CPU usage. If Defender still consumes significant CPU, record another performance trace instead of adding broad exclusions blindly.

### Result

After adding the `.codex-tmp` exclusion, Microsoft Defender CPU usage dropped noticeably during the same type of Codex workload.

### Security guardrails

- Exclude only trusted repositories and generated directories.
- Prefer narrow path exclusions over excluding the entire project tree.
- Do not exclude the whole `C:\Serwer` directory, the entire drive, the Downloads directory, or the user profile.
- Do not globally exclude processes such as `node.exe`, `powershell.exe`, `dllhost.exe`, Git, Docker, or Codex.
- Keep source files, scripts, downloaded archives, and unknown dependencies covered whenever practical.
- Reassess exclusions if the repository layout or Codex temporary-directory behavior changes.

### Reusable checklist

1. Confirm that Defender is the process consuming CPU.
2. Record a representative workload with `New-MpPerformanceRecording`.
3. Inspect top paths, files, and processes with `Get-MpPerformanceReport`.
4. Identify the narrow generated directory causing the scans.
5. Add a path exclusion with `Add-MpPreference`.
6. Verify the saved exclusion list.
7. Repeat the workload and compare CPU usage.
8. Avoid broad process or drive exclusions.
