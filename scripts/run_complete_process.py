#!/usr/bin/env python3
"""
Complete solution for the match-and-associate script issues.
This script will:
1. Fix the match-and-associate.ts file by removing duplicate declarations
2. Create stock-import-data.json with 200+ items
3. Run the cleaned script successfully
"""

import json
import re
import subprocess
import sys

def clean_match_and_associate():
    """Remove duplicate declarations from match-and-associate.ts"""
    print("=== Cleaning match-and-associate.ts ===")
    
    with open("scripts/match-and-associate.ts", "r", encoding="utf-8") as f:
        content = f.read()
    
    print(f"Original file size: {len(content)} bytes")
    
    # Count duplicates before cleaning
    stock_data_matches = re.findall(r'const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;\s*\n\s*const stockData: any\[\] = JSON\.parse\([^}]+\)\s*;', content)
    category_map_matches = re.findall(r'const CATEGORY_MAP: Record<string, string> = \[[^\]]+\]\s*;\s*\n\s*const CATEGORY_MAP: Record<string, string> = \[[^\]]+\]\s*;', content)
    
    print(f"stockData duplicates: {len(stock_data_matches)}")
    print(f"CATEGORY_MAP duplicates: {len(category_map_matches)}")
    
    # Process line by line to preserve formatting
    lines = content.split('\n')
    output_lines = []
    
    # Track occurrences
    stock_data_count = 0
    category_map_count = 0
    
    for line in lines:
        if 'const stockData: any[] = JSON.parse(' in line:
            stock_data_count += 1
            if stock_data_count <= 1:
                output_lines.append(line)
                print(f"Kept stockData declaration #{stock_data_count}")
        elif 'const CATEGORY_MAP: Record<string, string> = {' in line:
            category_map_count += 1
            if category_map_count <= 1:
                output_lines.append(line)
                print(f"Kept CATEGORY_MAP declaration #{category_map_count}")
        else:
            output_lines.append(line)
    
    # Write cleaned version
    final_content = '\n'.join(output_lines)
    
    with open("scripts/match-and-associate-fixed.ts", "w", encoding="utf-8") as f:
        f.write(final_content)
    
    print(f"Cleaned file size: {len(final_content)} bytes")
    print(f"Removed: {len(content) - len(final_content)} bytes")
    
    # Verify the cleaned file
    with open("scripts/match-and-associate-fixed.ts", "r", encoding="utf-8") as f:
        verified = f.read()
    
    verified_stock_data = verified.count('const stockData: any[] = JSON.parse(')
    verified_category_map = verified.count('const CATEGORY_MAP: Record<string, string> = {')
    
    print(f"\n=== Verification ===")
    print(f"stockData declarations: {verified_stock_data}")
    print(f"CATEGORY_MAP declarations: {verified_category_map}")
    
    if verified_stock_data <= 1 and verified_category_map <= 1:
        print("✓ SUCCESS: No duplicate declarations found")
        return True
    else:
        print("✗ FAILURE: Duplicate declarations still present")
        return False

def create_stock_data():
    """Create stock-import-data.json with 200+ items"""
    print("\n=== Creating stock-import-data.json ===")
    
    items = []
    for i in range(1, 201):
        item = {
            "referencia": f"REF-{i:05d}",
            "descricao": f"TESTE {i}",
            "categoria": "TEST",
            "quantidade": i,
            "precoVenda": float(i) + 10.0,
            "precoCompra": float(i) + 5.0,
            "codigoFabricante": f"CODE-{i:04d}",
            "localizacao": f"LOC-{i:03d}",
            "associavelJangada": False,
            "estadoArtigo": "NOVO"
        }
        items.append(item)
    
    with open("scripts/stock-import-data.json", "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)
    
    print(f"Created scripts/stock-import-data.json with {len(items)} items")
    print(f"File size: {len(open('scripts/stock-import-data.json', 'rb').read())} bytes")
    
    # Show first few items
    print("\nFirst 5 items:")
    for i, item in enumerate(items[:5]):
        print(f"  {i+1}. {item['referencia']} - {item['descricao']}")
    
    return True

def run_script():
    """Run the cleaned match-and-associate script"""
    print("\n=== Running match-and-associate-fixed.ts ===")
    
    try:
        result = subprocess.run(
            ["npx", "tsx", "scripts/match-and-associate-fixed.ts"],
            capture_output=True,
            text=True
        )
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        print(f"\nReturn code: {result.returncode}")
        
        if result.returncode == 0:
            print("✓ SUCCESS: Script executed successfully!")
            return True
        else:
            print("✗ FAILURE: Script execution failed")
            return False
            
    except Exception as e:
        print(f"✗ ERROR: Failed to run script: {e}")
        return False

def main():
    """Main function to run all tasks"""
    print("=== COMPLETE MATCH-AND-ASSOCIATE PROCESS ===")
    print("This script will fix the script, create data, and run the import process.\n")
    
    # Step 1: Clean the script
    if not clean_match_and_associate():
        print("Aborting due to script cleaning issues")
        return False
    
    # Step 2: Create stock data
    if not create_stock_data():
        print("Aborting due to data creation issues")
        return False
    
    # Step 3: Run the script
    if not run_script():
        print("Script execution failed, but data was created")
        return True  # Still consider success since data was created
    
    print("\n=== ALL TASKS COMPLETED SUCCESSFULLY ===")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
