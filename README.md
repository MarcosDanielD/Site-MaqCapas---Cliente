# MaqCapas — Site Institucional & Catálogo de Proteção Sob Medida

Website oficial da **MaqCapas**, fabricante de capas sob medida para informática, vestidos de noiva, ternos e maquinário industrial desde 1987 em Curitiba/PR.

---

## 📁 Estrutura de Arquivos

O projeto adota o padrão de isolamento com diretório `./public` como raiz estática de deploy no Cloudflare Pages / Workers:

```
├── public/                 # Raiz pública de deploy (apenas arquivos servidos)
│   ├── assets/
│   │   ├── icons/          # Favicons (SVG, PNG, Apple Touch Icon)
│   │   └── images/         # Imagens originais e WebP com dimensões exatas
│   ├── 404.html            # Página de erro 404 personalizada
│   ├── index.html          # Documento principal compilado
│   ├── robots.txt          # Regras para indexadores e sitemap
│   ├── sitemap.xml         # Mapa do site com URLs canônicas
│   ├── style.css           # Estilos de produção
│   ├── script.js           # Scripts de interatividade e acessibilidade
│   ├── _headers            # Headers de segurança (CSP, HSTS, nosniff, XFO)
│   └── _redirects          # Redirecionamentos estáticos
├── src/                    # Arquivos fontes (não expostos na web)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── scripts/                # Scripts de compilação, otimização e testes
│   ├── build.js            # Compilador e gerador estático
│   ├── process-images.js   # Conversor de imagens para WebP com metadados
│   ├── smoke.js            # Teste de fumaça HTTP contra URLs
│   └── test-smoke-local.js # Servidor local de teste de fumaça
├── audit.js                # Suite de auditoria pré-lançamento
├── site.config.js          # Configurações da empresa e ambiente
├── wrangler.jsonc          # Configuração de deploy Cloudflare
└── package.json
```

---

## 🚀 Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run build` | Compila os arquivos fontes de `src/` e metadados para `public/`. |
| `npm run audit` | Executa a suite de auditoria em modo staging (verifica estrutura, headers e alerta dados pendentes). |
| `npm run audit:prod` | Executa o gate estrito de produção. **Reprova obrigatoriamente** se houver marcadores `[CONFIRMAR COM O CLIENTE]` ou domínio placeholder. |
| `npm run smoke -- <URL>` | Executa o teste de fumaça HTTP contra o alvo (local ou remoto). |

---

## 🔒 Dados Cadastrais & Marcadores de Produção

Por diretriz estrita, **nenhum dado cadastral é inventado**.
Os campos cadastrais da empresa são gerenciados centralmente em `site.config.js`:
- CNPJ: `COMPANY_CNPJ`
- Razão Social: `COMPANY_RAZAO_SOCIAL`
- Endereço / CEP: `COMPANY_ENDERECO` / `COMPANY_CEP`
- E-mail: `COMPANY_EMAIL`
- Horário de Atendimento: `COMPANY_HORARIO`

Quando não informados formalmente pelo cliente, estes campos exibem o marcador visual `[CONFIRMAR COM O CLIENTE]`, bloqueando qualquer tentativa de deploy em produção via `npm run audit:prod`.

---

## 🛡️ Segurança HTTP

O arquivo `public/_headers` implementa:
- **Content-Security-Policy (CSP)** estrita: `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; ...` (sem uso de `'unsafe-inline'` em scripts).
- **HSTS**: `max-age=31536000; includeSubDomains`.
- **X-Content-Type-Options**: `nosniff`.
- **X-Frame-Options**: `DENY`.
- **Referrer-Policy**: `strict-origin-when-cross-origin`.
- **Isolamento de arquivos internos**: `/package.json`, `/wrangler.jsonc`, `/.env`, `/src/*` retornam HTTP 404.

