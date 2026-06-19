import sys
import json
import PyPDF2
import re

def limpar_texto(texto):
    """Remove caracteres problemáticos de encoding"""
    # Mapa de substituições comuns
    replacements = {
        '═': '\u00ED',  # í
        'Ã': '\u00E3',  # ã
        'Ò': '\u00E3',  # ã
        'Ô': '\u00F4',  # ô
        'Õ': '\u00F5',  # õ
        'Ú': '\u00FA',  # ú
    }
    for old, new in replacements.items():
        texto = texto.replace(old, new)
    return texto

def extrair_moradas_pdf(pdf_path):
    clientes = []
    
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        
        for page_num, page in enumerate(pdf_reader.pages):
            texto_page = page.extract_text()
            texto_page = limpar_texto(texto_page)
            
            # Divide o texto em linhas
            linhas = [l.strip() for l in texto_page.split('\n') if l.strip()]
            
            # Procura por blocos de dados estruturados
            i = 0
            while i < len(linhas):
                linha = linhas[i]
                
                # Ignora cabeçalhos repetitivos
                if 'LICENÇA' in linha.upper() or 'OPERADOR' in linha.upper() or 'TURÍSTICO' in linha.upper():
                    i += 1
                    continue
                
                # Nome do cliente (geralmente linha com letras maiúsculas, comprimento razoável)
                if len(linha) > 10 and not re.match(r'^(Rua|Avenida|Av\.|Tel|NIF|Email)', linha, re.I):
                    # Separa número de licença se houver
                    licenca_match = re.match(r'(\d+/\d+)\s+(.+)', linha)
                    if licenca_match:
                        numero_licenca = licenca_match.group(1)
                        resto_linha = licenca_match.group(2)
                    else:
                        resto_linha = linha
                    
                    # Separa nome da morada (se morada estiver na mesma linha)
                    partes = resto_linha.split('Rua ')
                    if len(partes) == 2:
                        nome_cliente = partes[0].strip()
                        morada_inicial = 'Rua ' + partes[1]
                    else:
                        partes = resto_linha.split('Canada ')
                        if len(partes) == 2:
                            nome_cliente = partes[0].strip()
                            morada_inicial = 'Canada ' + partes[1]
                        else:
                            partes = resto_linha.split('Avenida ')
                            if len(partes) == 2:
                                nome_cliente = partes[0].strip()
                                morada_inicial = 'Avenida ' + partes[1]
                            else:
                                partes = resto_linha.split('Travessa ')
                                if len(partes) == 2:
                                    nome_cliente = partes[0].strip()
                                    morada_inicial = 'Travessa ' + partes[1]
                                else:
                                    partes = resto_linha.split('Caminho ')
                                    if len(partes) == 2:
                                        nome_cliente = partes[0].strip()
                                        morada_inicial = 'Caminho ' + partes[1]
                                    else:
                                        partes = resto_linha.split('Estrada ')
                                        if len(partes) == 2:
                                            nome_cliente = partes[0].strip()
                                            morada_inicial = 'Estrada ' + partes[1]
                                        else:
                                            partes = resto_linha.split('Av. ')
                                            if len(partes) == 2:
                                                nome_cliente = partes[0].strip()
                                                morada_inicial = 'Av. ' + partes[1]
                                            else:
                                                partes = resto_linha.split('Calþada ')
                                                if len(partes) == 2:
                                                    nome_cliente = partes[0].strip()
                                                    morada_inicial = 'Calþada ' + partes[1]
                                                else:
                                                    partes = resto_linha.split('Ladeira ')
                                                    if len(partes) == 2:
                                                        nome_cliente = partes[0].strip()
                                                        morada_inicial = 'Ladeira ' + partes[1]
                                                    else:
                                                        partes = resto_linha.split('Lugar ')
                                                        if len(partes) == 2:
                                                            nome_cliente = partes[0].strip()
                                                            morada_inicial = 'Lugar ' + partes[1]
                                                        else:
                                                            partes = resto_linha.split('FajÒ ')
                                                            if len(partes) == 2:
                                                                nome_cliente = partes[0].strip()
                                                                morada_inicial = 'FajÒ ' + partes[1]
                                                            else:
                                                                nome_cliente = resto_linha.strip()
                                                                morada_inicial = None
                    
                    cliente = {'nome': nome_cliente}
                    if morada_inicial:
                        cliente['morada'] = morada_inicial
                    
                    # Procura os próximos campos (morada, ilha, etc.) nas linhas seguintes
                    j = i + 1
                    while j < len(linhas) and j < i + 10:  # Limite de 10 linhas por cliente
                        proxima = linhas[j]
                        
                        # Morada
                        if re.match(r'^(Rua|Avenida|Av\.|R\.|Estrada|Caminho|Largo|Praça|Travessa|Canada)', proxima, re.I):
                            cliente['morada'] = proxima
                        
                        # Código postal e localidade
                        elif re.match(r'\d{4}-\d{3}', proxima):
                            cliente['ilha'] = proxima
                        
                        # Telefone
                        elif re.search(r'Tel[^:]*:\s*(\d[\d\s]+)', proxima, re.I):
                            tel_match = re.search(r'(\d[\d\s]{7,})', proxima)
                            if tel_match:
                                cliente['telefone'] = tel_match.group(0).replace(' ', '')
                        
                        # Telemóvel
                        elif re.search(r'Tlm|Telemóvel', proxima, re.I):
                            tel_match = re.search(r'(\d[\d\s]{7,})', proxima)
                            if tel_match:
                                cliente['telmovel'] = tel_match.group(0).replace(' ', '')
                        
                        # Email
                        elif '@' in proxima:
                            email_match = re.search(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', proxima)
                            if email_match:
                                cliente['email'] = email_match.group(0)
                        
                        # NIF
                        elif re.search(r'NIF', proxima, re.I):
                            nif_match = re.search(r'(\d{9})', proxima)
                            if nif_match:
                                cliente['nif'] = nif_match.group(0)
                        
                        # Se encontrar outro nome de cliente, para
                        elif len(proxima) > 10 and not any(kw in proxima.upper() for kw in ['RUA', 'AVENIDA', 'TEL', 'NIF', 'EMAIL', '@']):
                            break
                        
                        j += 1
                    
                    # Adiciona cliente se tiver pelo menos nome e mais algum campo
                    if len(cliente) > 1:
                        clientes.append(cliente)
                    
                    i = j
                else:
                    i += 1
    
    return clientes

if __name__ == '__main__':
    pdf_path = 'OMT - Moradas.pdf'
    clientes = extrair_moradas_pdf(pdf_path)
    print(json.dumps(clientes, ensure_ascii=False, indent=2))
