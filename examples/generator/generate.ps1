param(
    [Parameter(Mandatory=$true)][string]$Language,
    [Parameter(Mandatory=$true)][string]$OutputDirectory
)
python "$PSScriptRoot/generate.py" $Language --output $OutputDirectory --clean
exit $LASTEXITCODE
