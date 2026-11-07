// Painel da equipe (GET /painel): página estática que pede a chave e mostra /v1/metricas.
// O script fica em /painel.js porque o helmet bloqueia script inline (CSP script-src 'self').

export const PAINEL_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Conecta · Métricas</title>
<style>
:root{--fundo:#F7F5F0;--cartao:#fff;--texto:#1d2b28;--suave:#5d6b68;--marca:#1F7A6B;--marca2:#9fd3c7;--linha:#e6e1d6}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:20px 16px 48px}
h1{font-size:22px;margin:0 0 4px}
p.sub{margin:0 0 20px;color:var(--suave);font-size:14px}
form{display:flex;flex-direction:column;gap:10px;background:var(--cartao);border:1px solid var(--linha);border-radius:16px;padding:16px}
input,select,button{font:inherit;padding:12px;border-radius:12px;border:1px solid var(--linha);background:#fff;color:var(--texto)}
button{background:var(--marca);color:#fff;border:0;font-weight:600}
label.lembrar{display:flex;gap:8px;align-items:center;font-size:14px;color:var(--suave)}
.barra{display:flex;gap:8px;align-items:center;margin-bottom:16px}
.barra select{flex:1}
.barra button{background:#fff;color:var(--marca);border:1px solid var(--marca)}
.grade{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}
.card{background:var(--cartao);border:1px solid var(--linha);border-radius:16px;padding:14px}
.card b{display:block;font-size:28px;color:var(--marca);line-height:1.1}
.card span{font-size:13px;color:var(--suave)}
section{background:var(--cartao);border:1px solid var(--linha);border-radius:16px;padding:16px;margin-bottom:16px}
h2{font-size:16px;margin:0 0 12px}
table{width:100%;border-collapse:collapse;font-size:14px}
td{padding:6px 0;border-bottom:1px solid var(--linha)}
td:last-child{text-align:right;font-weight:600}
.dias{display:flex;align-items:flex-end;gap:2px;height:120px;border-bottom:1px solid var(--linha)}
.dias div{flex:1;background:var(--marca);border-radius:3px 3px 0 0;min-height:1px}
.eixo{display:flex;justify-content:space-between;font-size:12px;color:var(--suave);margin-top:4px}
.aviso{color:var(--suave);font-size:14px}
.erro{color:#b3261e}
[hidden]{display:none!important}
</style>
</head>
<body>
<main>
<h1>FonoInova Conecta</h1>
<p class="sub">Quantas famílias usam e instalaram o app. Números anônimos.</p>
<form id="entrar">
  <input id="chave" type="password" autocomplete="current-password" placeholder="Chave da equipe (ADMIN_API_KEY)" required>
  <label class="lembrar"><input id="lembrar" type="checkbox" checked> Lembrar neste aparelho</label>
  <button>Ver métricas</button>
</form>
<p id="status" class="aviso" hidden></p>
<div id="painel" hidden>
  <div class="barra">
    <select id="dias"><option value="7">Últimos 7 dias</option><option value="30" selected>Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select>
    <button id="sair" type="button">Sair</button>
  </div>
  <div class="grade" id="cards"></div>
  <section><h2>Famílias ativas por dia</h2><div class="dias" id="grafico"></div><div class="eixo"><span id="ini"></span><span id="fim"></span></div></section>
  <section><h2>Uso no período</h2><table id="uso"></table></section>
  <section><h2>Aparelhos</h2><table id="plataformas"></table></section>
  <p class="aviso" id="rodape"></p>
</div>
</main>
<script src="/painel.js"></script>
</body>
</html>`;

export const PAINEL_JS = `(function(){
var CHAVE='conecta-painel-chave';
var $=function(id){return document.getElementById(id)};
var guardada=null;try{guardada=localStorage.getItem(CHAVE)}catch(e){}
var chave=guardada;
function status(t,erro){var s=$('status');s.hidden=!t;s.textContent=t||'';s.className=erro?'aviso erro':'aviso'}
function linhas(el,pares){el.innerHTML='';pares.forEach(function(p){var tr=document.createElement('tr');var a=document.createElement('td');a.textContent=p[0];var b=document.createElement('td');b.textContent=p[1];tr.appendChild(a);tr.appendChild(b);el.appendChild(tr)})}
function br(d){var p=d.split('-');return p[2]+'/'+p[1]}
var NOMES={android:'Android',ios:'iPhone',desktop:'Computador',outro:'Outro',desconhecida:'Versão antiga (sem info)'};
function mostrar(m){
  $('entrar').hidden=true;$('painel').hidden=false;status('');
  var c=[['Famílias usando',m.totais.usuarios],['Instalaram na tela inicial',m.totais.instalados],['Ativas hoje',m.ativos.hoje],['Ativas em 7 dias',m.ativos.ultimos7dias],['Novas no período',m.periodo.novosUsuarios],['Instalações no período',m.periodo.novasInstalacoes]];
  var g=$('cards');g.innerHTML='';c.forEach(function(x){var d=document.createElement('div');d.className='card';var b=document.createElement('b');b.textContent=x[1];var s=document.createElement('span');s.textContent=x[0];d.appendChild(b);d.appendChild(s);g.appendChild(d)});
  var max=Math.max.apply(null,m.porDia.map(function(d){return d.ativos}).concat([1]));
  var gr=$('grafico');gr.innerHTML='';m.porDia.forEach(function(d){var b=document.createElement('div');b.style.height=(d.ativos/max*100)+'%';b.title=br(d.dia)+': '+d.ativos+' ativas, '+d.novos+' novas, '+d.instalacoes+' instalações';gr.appendChild(b)});
  $('ini').textContent=br(m.porDia[0].dia);$('fim').textContent=br(m.porDia[m.porDia.length-1].dia);
  var u=m.uso;linhas($('uso'),[['Aberturas do app',u.aberturas],['Triagens concluídas',u.triagens],['Missões concluídas',u.missoes],['Registros no diário',u.diario],['Cliques no WhatsApp',u.whatsapp],['Interesse em kit',u.kitInteresse],['Indicações a outras famílias',u.indicacoes],['Convidadas a instalar (Android)',m.totais.convidadosAInstalar]]);
  linhas($('plataformas'),Object.keys(m.totais.porPlataforma).map(function(k){return[NOMES[k]||k,m.totais.porPlataforma[k]]}));
  $('rodape').textContent='Atualizado '+new Date(m.geradoEm).toLocaleString('pt-BR')+'. Conta só quem aceitou o termo do app.';
}
function carregar(){
  status('Carregando… se o servidor estava dormindo, pode levar até 1 minuto.');
  fetch('/v1/metricas?dias='+$('dias').value,{headers:{'x-api-key':chave}}).then(function(r){
    if(r.status===401){try{localStorage.removeItem(CHAVE)}catch(e){}chave=null;$('painel').hidden=true;$('entrar').hidden=false;throw new Error('Chave incorreta.')}
    if(!r.ok)throw new Error('Erro '+r.status+'. Tente de novo.');
    return r.json();
  }).then(mostrar).catch(function(e){status(e.message,true)});
}
$('entrar').addEventListener('submit',function(ev){ev.preventDefault();chave=$('chave').value.trim();if($('lembrar').checked){try{localStorage.setItem(CHAVE,chave)}catch(e){}}carregar()});
$('dias').addEventListener('change',carregar);
$('sair').addEventListener('click',function(){try{localStorage.removeItem(CHAVE)}catch(e){}chave=null;$('painel').hidden=true;$('entrar').hidden=false});
if(chave)carregar();
})();`;
