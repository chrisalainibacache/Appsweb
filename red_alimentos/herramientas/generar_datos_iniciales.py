"""Genera src/DatosIniciales.gs a partir de un JSON extraído del portal.

Uso: python herramientas/generar_datos_iniciales.py datos/retiros_2026-10-29.json
"""
import json
import sys
from pathlib import Path

origen = Path(sys.argv[1] if len(sys.argv) > 1 else 'datos/retiros_2026-10-29.json')
datos = json.loads(origen.read_text(encoding='utf-8'))
salida = Path(__file__).resolve().parent.parent / 'src' / 'DatosIniciales.gs'
cuerpo = json.dumps({k: datos[k] for k in ('tienda', 'bodega')}, ensure_ascii=False, separators=(',', ':'))
salida.write_text(
    '/**\n'
    ' * Retiros extraídos de somos.redalimentos.cl el 29-10-2026 (31 tienda + 34 bodega).\n'
    f' * Generado por herramientas/generar_datos_iniciales.py desde {origen.as_posix()}.\n'
    ' * Se cargan con el menú "Cargar datos iniciales". Una vez cargados, este archivo se puede borrar.\n'
    ' */\n'
    f'const DATOS_INICIALES = {cuerpo};\n',
    encoding='utf-8')
print(f'{salida} ({salida.stat().st_size} bytes)')
