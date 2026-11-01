# API do FonoInova Conecta

Node 20+, Express 5, MongoDB (Atlas M0), Zod. Recebe só dados anônimos: nunca respostas da triagem, resultado, nome, nascimento ou telefone.

## Rodar

```bash
cd server
cp .env.example .env      # preencha MONGODB_URI e ADMIN_API_KEY
npm install
npm run seed:conteudo     # publica perguntas, textos e missões no banco
npm run dev               # http://localhost:3333
npm test                  # testes da API (TESTE_MONGO=1 para incluir o Mongo real)
```

## Rotas

| Método | Rota | Para quê | Resposta |
|---|---|---|---|
| GET | `/saude` | Monitoramento | `200 {ok:true}` ou `503` |
| GET | `/v1/conteudo` | Conteúdo versionado. Mande `If-None-Match` para baixar só quando mudar | `200 {versao, publicadoEm, dados}` ou `304` |
| POST | `/v1/eventos` | Eventos anônimos de uso, até 50 por lote | `202 {novos, duplicados}` |
| POST | `/v1/leads` | Código CONECTA-XXXX quando a família abre o WhatsApp | `201` novo, `200` repetido |
| GET | `/v1/leads/:codigo` | Equipe confere se um código veio do app (header `x-api-key`) | `200`, `401` ou `404` |

Exemplo de evento:

```json
{
  "instalacaoId": "inst-lx2abc-9f3k2a",
  "versaoApp": "1.0.0",
  "eventos": [
    { "id": "ev-lx2abd-1a2b3c", "em": "2026-10-31T13:00:00.000Z", "tipo": "missao_concluida", "missaoId": "m06-conversa-bebe", "como": "facil" }
  ]
}
```

Tipos aceitos: `app_aberto`, `triagem_concluida` (com `faixaId`), `missao_concluida` (com `missaoId` e `como`) e `whatsapp_aberto` (com `origem`). Campos fora do contrato são descartados.

## Garantias

- **Idempotente:** eventos pelo `id` e leads pelo `codigo`. O app pode reenviar sem duplicar.
- **Limite:** 60 requisições por minuto por IP nas rotas de escrita.
- **Segurança:** helmet, CORS fechado por padrão, corpo de até 32 KB, comparação da chave em tempo constante, e logs sem corpo de requisição.

## Deploy no Render (piloto)

O `render.yaml` na raiz do repositório descreve o serviço `conecta-api` (pasta `server/`, branch `main`, health check em `/saude`).

1. No Render: New → Blueprint → escolha o repositório `fonoinona-conecta`.
2. Quando pedir `MONGODB_URI`, cole a connection string do usuário `conecta_api`, com o banco `conecta` no caminho (`...mongodb.net/conecta?...`). Ela fica só no painel.
3. `ADMIN_API_KEY` é gerada pelo Render (Environment → ver valor). É a chave do `GET /v1/pre-cadastros`.
4. No Atlas, em Network Access, libere `0.0.0.0/0`: o plano gratuito do Render não tem IP de saída fixo. A proteção fica no usuário e na senha do banco.
5. Teste: `https://<seu-servico>.onrender.com/saude` deve responder `{"ok":true}`.
6. Opcional: publicar o conteúdo com `npm run seed:conteudo` (com o `.env` apontando para o Atlas).

Depois, no app: `EXPO_PUBLIC_API_URL=https://<seu-servico>.onrender.com` nas variáveis de build da Cloudflare.

No plano gratuito o serviço dorme após 15 minutos sem uso, e a primeira chamada depois disso leva cerca de 1 minuto. O app não trava com isso, porque a telemetria vai numa fila e é reenviada depois.
