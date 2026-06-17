# Set JAVA_HOME dari Android Studio (untuk expo run:android)
$jbr = "C:\Program Files\Android\Android Studio\jbr"
if (-not (Test-Path "$jbr\bin\java.exe")) {
  Write-Error "Java tidak ditemukan di $jbr. Install Android Studio atau set JAVA_HOME manual."
  exit 1
}
$env:JAVA_HOME = $jbr
$env:PATH = "$jbr\bin;$env:PATH"
Write-Host "JAVA_HOME = $env:JAVA_HOME"
Set-Location $PSScriptRoot\..
npx expo run:android @args
