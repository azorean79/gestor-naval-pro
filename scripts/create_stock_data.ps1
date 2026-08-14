# Generate the complete stock-import-data.json with 200+ items

$items = @()

# Generate 200 test items
for ($i = 1; $i -le 200; $i++) {
    $item = [PSCustomObject]@{ 
        referncia = "REF-$($i.ToString('D5'))"
        descricao = "Test Item $i"
        categoria = if ($i % 10 -eq 0) { "CILINDROS" } else { "DIVERSOS" }
        quantidade = $i
        precoVenda = $i * 10.0
        precoCompra = $i * 5.0
        codigoFabricante = "CODE-$($i.ToString('D3'))"
        localizacao = "LOC-$($i % 20 + 1)"
        associavelJangada = if ($i % 15 -eq 0) { $true } else { $false }
        estadoArtigo = if ($i % 3 -eq 0) { "NOVO" } else { "SEMI-NOVO" }
    }
    $items += $item
}

# Write to JSON file with indentation for readability
$json = $items | ConvertTo-Json -Depth 4
$json | Set-Content "stock-import-data.json" -Encoding UTF8

Write-Host "Created stock-import-data.json with $($items.Count) items"
Write-Host "File size: $((Get-Item 'stock-import-data.json').Length) bytes"
Write-Host "First item: $($items[0].referncia) - $($items[0].descricao)"
Write-Host "Last item: $($items[-1].referncia) - $($items[-1].descricao)"
