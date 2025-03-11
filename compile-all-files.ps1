# PowerShell script to compile all code files into a single document

# Create timestamp for filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputFile = "codebase-snapshot-$timestamp.txt"

# Initialize output file with header
"Conqueror's Quest - Complete Codebase Snapshot" | Out-File -FilePath $outputFile
"Created: $(Get-Date)" | Add-Content -Path $outputFile
"========================================================" | Add-Content -Path $outputFile
"" | Add-Content -Path $outputFile

# Define file extensions to include
$extensions = @("*.js", "*.json", "*.html", "*.css", "*.md", "*.bat", "*.txt", "*.ps1")

# Define directories to exclude
$excludeDirs = @("node_modules", ".git")

# Define file patterns to exclude
$excludePatterns = @("codebase-snapshot-*.txt")

Write-Host "Scanning for all code files..."

# Get all files with relevant extensions, excluding specified directories and patterns
$files = Get-ChildItem -Path . -Recurse -File -Include $extensions | 
         Where-Object { 
             $exclude = $false
             
             # Check if in excluded directory
             foreach ($dir in $excludeDirs) {
                 if ($_.FullName -like "*\$dir\*") {
                     $exclude = $true
                     break
                 }
             }
             
             # Check if matches excluded pattern
             if (-not $exclude) {
                 foreach ($pattern in $excludePatterns) {
                     if ($_.Name -like $pattern) {
                         $exclude = $true
                         break
                     }
                 }
             }
             
             -not $exclude
         }

$totalFiles = $files.Count
$processedFiles = 0

# Process each file
foreach ($file in $files) {
    $processedFiles++
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    
    Write-Host "Processing ($processedFiles/$totalFiles): $relativePath"
    
    # Write file header to output
    "FILE: $relativePath" | Add-Content -Path $outputFile
    "--------------------------------------------------------" | Add-Content -Path $outputFile
    
    # Add file contents
    Get-Content -Path $file.FullName | Add-Content -Path $outputFile
    
    # Add empty lines after file
    "" | Add-Content -Path $outputFile
    "" | Add-Content -Path $outputFile
}

# Add summary section
"========================================================" | Add-Content -Path $outputFile
"Summary of files included:" | Add-Content -Path $outputFile

# Group files by extension and count
$extensionCounts = $files | Group-Object -Property Extension | 
                   Sort-Object -Property Count -Descending

foreach ($ext in $extensionCounts) {
    " - $($ext.Count) files with extension $($ext.Name)" | Add-Content -Path $outputFile
}

"" | Add-Content -Path $outputFile
"Note: Previous snapshot files were excluded from this compilation." | Add-Content -Path $outputFile

# Get file size
$fileSize = (Get-Item -Path $outputFile).Length
$readableSize = if ($fileSize -gt 1MB) {
    "{0:N2} MB" -f ($fileSize / 1MB)
} elseif ($fileSize -gt 1KB) {
    "{0:N2} KB" -f ($fileSize / 1KB)
} else {
    "$fileSize bytes"
}

Write-Host "Finished creating codebase snapshot: $outputFile"
Write-Host "Total size: $readableSize"
Write-Host ""
Write-Host "You can now use this file to share your entire codebase with AI assistants." 