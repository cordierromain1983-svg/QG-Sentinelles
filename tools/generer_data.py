#!/usr/bin/env python3
"""Génère data/*.json (contenus NON personnels) depuis l'export .xlsx du classeur.
Usage : python3 tools/generer_data.py QG_Donnees.xlsx   (depuis la racine du site)
Ne lit aucun onglet contenant des données personnelles."""
import sys, json, datetime, os, openpyxl
FEUILLES = ["FAQ","PARCOURS","MODULES","MISSIONS_FLASH","DEFIS","ACTUALITES","RESSOURCES","REUSSITES","BADGES","COMPETENCES","FICHES_MISSIONS"]
def txt(v):
    if v is None: return ""
    if isinstance(v, datetime.datetime):
        return v.strftime("%Y-%m-%d") if (v.hour, v.minute, v.second) == (0, 0, 0) else v.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(v, bool): return "TRUE" if v else "FALSE"
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
os.makedirs("data", exist_ok=True)
for nom in FEUILLES:
    lignes = list(wb[nom].iter_rows(values_only=True))
    ent = lignes[0]
    out = []
    for l in lignes[1:]:
        if all(c in (None, "") for c in l): continue
        out.append({h: txt(l[i]) for i, h in enumerate(ent) if h})
    with open(f"data/{nom}.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(nom, len(out))
