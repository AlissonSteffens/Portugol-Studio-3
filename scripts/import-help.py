from pathlib import Path
import re, json, html, shutil, argparse, posixpath
parser = argparse.ArgumentParser(description='Importa a ajuda do Portugol Studio 2 para a versão Web.')
parser.add_argument('repository', type=Path, help='Diretório do repositório Portugol-Studio')
repository = parser.parse_args().repository
source = repository / 'ide/src/main/assets/ajuda'
target = Path('public/ajuda')
target.mkdir(parents=True, exist_ok=True)
shutil.copytree(source/'recursos/imagens', target/'recursos/imagens', dirs_exist_ok=True)
shutil.copyfile(repository/'LICENSE.md', target/'LICENSE.md')
(target/'ORIGEM.md').write_text('Conteúdo adaptado da ajuda do Portugol Studio 2, UNIVALI-LITE.\nFonte: ide/src/main/assets/ajuda no repositório Portugol-Studio.\nLicença original: LICENSE.md (GNU GPL v3).\nOs exemplos foram incorporados às páginas para leitura sem dependências Java.\n', encoding='utf-8')
tree=(source/'scripts/topicos.js').read_text(encoding='utf-8-sig')
names={path:title for title,path in re.findall(r'titulo:\s*"([^"]+)",\s*html:\s*"([^"]+)"',tree)}
groups={'tipos':'Tipos de dados','declaracoes':'Variáveis e funções','entrada_saida':'Entrada e saída','expressao':'Expressões e operadores','estruturas_controle':'Estruturas de controle','bibliotecas':'Bibliotecas'}
index=[]
for p in sorted((source/'topicos').rglob('*.html')):
 text=p.read_text(encoding='utf-8-sig')
 rel=p.relative_to(source).as_posix()
 title=names.get(rel) or html.unescape(re.search(r'<title>(.*?)</title>',text,re.S).group(1))
 body=re.search(r'<body[^>]*>(.*?)</body>',text,re.S).group(1)
 def code(match):
  attrs=match.group(1)
  file=re.search(r'data-file=[\'\"]([^\'\"]+)',attrs)
  if not file: return match.group(0)
  example=(p.parent/file.group(1)).resolve()
  if not example.is_file(): raise RuntimeError(f'Exemplo ausente: {example}')
  data=example.read_bytes()
  try: value=data.decode('utf-8-sig')
  except UnicodeDecodeError: value=data.decode('cp1252')
  value=re.sub(r'/\*\s*\$\$\$ Portugol Studio.*?\*/', '', value, flags=re.S).strip()
  heading=re.search(r'data-title=[\'\"]([^\'\"]+)',attrs)
  return '<section class="code-example"><h3>'+html.escape(heading.group(1) if heading else 'Exemplo')+'</h3><pre><code>'+html.escape(value)+'</code></pre></section>'
 body=re.sub(r'<div\b([^>]*class\s*=\s*[\'\"]codigo-portugol[\'\"][^>]*)>\s*</div>',code,body)
 body=re.sub(r'href="(topicos/[^"]+)"', lambda match: 'href="' + posixpath.relpath(match.group(1), posixpath.dirname(rel)) + '"', body)
 body=re.sub(r'<script\b[^>]*>.*?</script>','',body,flags=re.S)
 out=target/rel;out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+html.escape(title)+'</title><link rel="stylesheet" href="'+posixpath.relpath('reader.css',posixpath.dirname(rel))+'"></head><body>'+body+'</body></html>',encoding='utf-8')
 category=groups.get(p.relative_to(source/'topicos').parts[1] if len(p.relative_to(source/'topicos').parts)>2 else '', 'Primeiros passos')
 plain=html.unescape(re.sub('<[^>]+>',' ',body))
 index.append({'title':title,'group':category,'path':'/ajuda/'+rel,'search':re.sub(r'\s+',' ',plain).strip()})
order = {path: position for position, path in enumerate(names)}
index.sort(key=lambda topic: order.get(topic['path'].removeprefix('/ajuda/'), len(order)))
(target/'index.json').write_text(json.dumps(index,ensure_ascii=False),encoding='utf-8')
print(f'{len(index)} tópicos importados com exemplos incorporados.')
