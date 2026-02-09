import openpyxl
import os

# Caminho do arquivo Excel
excel_file = r"C:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\OREY DIGITAL 2026\2025\CERTIFICADOS 2025\AZ25-065 BALEIAS EXPRESSO.xlsx"

# Carregar workbook
wb = openpyxl.load_workbook(excel_file, data_only=False)
cert_ws = wb['CERTIFICADO']
quad_ws = wb['QUADRO']

# Obter número de série da aba QUADRO
numero_serie = quad_ws['C7'].value
print(f"Número de série encontrado em QUADRO!C7: {numero_serie}")

# Verificar célula B18 que deve ter a série
print(f"B18 do CERTIFICADO tem: {cert_ws['B18'].value}")

# Se B18 está vazio ou None, adicionar o número de série
if not cert_ws['B18'].value:
    cert_ws['B18'] = numero_serie
    print(f"✓ B18 atualizado com: {numero_serie}")
    
    # Salvar arquivo
    wb.save(excel_file)
    print(f"✓ Arquivo salvo com sucesso!")
else:
    print(f"B18 já tem valor: {cert_ws['B18'].value}")

# Verificar se foi atualizado
wb2 = openpyxl.load_workbook(excel_file, data_only=False)
cert_ws2 = wb2['CERTIFICADO']
print(f"\nVerificação: B18 agora tem: {cert_ws2['B18'].value}")
