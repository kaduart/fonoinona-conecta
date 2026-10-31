# FonoInova Conecta

App gratuito da Clínica Fono Inova (Anápolis) para pais de crianças de 0 a 6 anos: triagem do desenvolvimento por idade, missões para fazer em casa e contato direto com a clínica pelo WhatsApp.

> A triagem não é diagnóstico. Responsável técnica: Lorrany Siqueira Marques, CRFa 5-13633.

## Stack

- Expo SDK 58 + React Native + TypeScript
- expo-router (navegação por arquivos em `src/app`)
- Dados só no celular, cifrados (XChaCha20-Poly1305, chave no Keychain/Keystore)
- API opcional em `server/` (Express + MongoDB) para conteúdo, eventos anônimos e leads
- Jest (`jest-expo`) para o motor de regras

## Como rodar

```bash
npm install
npx expo start        # abre no Expo Go, emulador ou web
npm test              # testes do motor de regras
npm run typecheck     # checagem de tipos
```

Variáveis de ambiente: copie `.env.example` para `.env` (que não vai para o Git).

```
EXPO_PUBLIC_WHATSAPP_CLINICA=5562XXXXXXXXX
EXPO_PUBLIC_API_URL=            # vazio = app 100% offline
```

A API fica em [`server/`](server/README.md).

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/app` | Telas: boas-vindas, consentimento, triagem, resultado |
| `src/content` | Perguntas por faixa etária e textos de resultado (versionados) |
| `src/domain` | Regras: idade corrigida, cálculo do resultado, código CONECTA |
| `src/components` | Componentes visuais da v3 (verde #1F7A6B) |
| `src/storage` | Repositório local cifrado |
| `src/api` | Cliente da API com fila e reenvio |
| `server` | API (Express + MongoDB) |
| `src/theme` | Tokens de design |

## Build e lojas (EAS)

```bash
npm install -g eas-cli
eas init                                   # uma vez: cria o projeto no Expo
eas build -p android --profile preview     # APK para testar com famílias
eas build -p all --profile production      # versão das lojas
eas submit -p android --latest             # Play Console, teste interno
eas submit -p ios --latest                 # TestFlight
```

Identificador: `br.com.fonoinova.conecta`. Guia completo, com textos das lojas e formulários de privacidade: https://claude.ai/artifact/9efxdBaRsTH9CmFdhA6ccZ

## Regra do resultado

- **Avaliação recomendada:** alerta marcado (regressão ou audição) ou 2+ respostas "Ainda não".
- **Vale observar:** 1 "Ainda não" ou 2+ "Às vezes".
- **Esperado:** demais casos.

Prematuros (< 37 semanas) usam idade corrigida até 24 meses. A mensagem do WhatsApp leva só o código CONECTA-XXXX, sem dados de saúde.

## Roadmap

1. **Sprint 1** — base, triagem por idade e resultado ✅
2. **Sprint 2** — missões, evolução, várias crianças ✅
3. **Sprint 3** — backend (MongoDB Atlas) e armazenamento criptografado ✅
4. **Sprint 4** — build e configuração das lojas ✅ (publicar depende das contas da clínica)
