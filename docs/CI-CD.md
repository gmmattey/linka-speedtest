# CI/CD — linka SpeedTest

> Como a integração contínua e o pipeline de release funcionam neste repositório. Inclui o setup completo de secrets, geração de keystore Android e configuração da Cloudflare Pages.

---

## Visão geral

Dois workflows GitHub Actions vivem em `.github/workflows/`:

- **`ci.yml`** — roda em **todo push** e em PR contra `main`. Faz lint, testes Vitest e build do PWA. Sobe `dist/` como artefato (retenção 7 dias).
- **`release.yml`** — roda em **push de tag `v*`** (ex.: `v1.2.0`). Em paralelo:
  - Faz build do PWA e deploy em **Cloudflare Pages**.
  - Faz `cap sync android`, build de **APK assinado** e anexa ao GitHub Release.

A política de branch única (`main`) continua valendo. Os workflows dispararem em qualquer branch protege casos limítrofes (forks, branches experimentais locais) sem mudar a regra.

---

## Versionamento

SemVer via tag git: `vMAJOR.MINOR.PATCH`. O `package.json` deve bater com a tag. Exemplo:

```bash
# 1) atualizar package.json para "1.2.0"
npm version 1.2.0 --no-git-tag-version
git add package.json
git commit -m "chore: release 1.2.0"

# 2) criar tag e push
git tag v1.2.0
git push && git push --tags
```

Pre-release: tag com hífen (`v1.2.0-rc.1`) — o GitHub Release marca como "prerelease" automaticamente.

---

## Setup inicial — UMA vez por repositório

### 1. Cloudflare Pages

#### 1.1 Criar projeto

No dashboard Cloudflare → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** ou **Direct Upload**.

- Nome do projeto: `linka-speedtest` (default usado pelos workflows; sobreponha via secret `CLOUDFLARE_PAGES_PROJECT` se quiser outro).
- Production branch: `main`.

Esse passo é **manual** e roda apenas uma vez. O CI usa `wrangler pages deploy` para enviar artefatos a esse projeto já existente — a action não cria projeto.

#### 1.2 Gerar API token

Cloudflare dashboard → ícone de perfil (canto superior direito) → **My Profile** → **API Tokens** → **Create Token** → template **"Edit Cloudflare Workers"** ou **Custom token** com:

- Permissions: **Account → Cloudflare Pages → Edit**.
- Account Resources: somente a conta dona do projeto Pages.

Copie o token (aparece uma vez).

#### 1.3 Account ID

Cloudflare dashboard → qualquer página da conta → painel direito tem **Account ID**. Copie.

### 2. Keystore Android

#### 2.1 Gerar keystore (uma vez)

Em ambiente local com JDK instalado:

```bash
keytool -genkeypair -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias linka \
  -dname "CN=linka SpeedTest, OU=linka, O=linka, L=Sao Paulo, ST=SP, C=BR"
```

Anote a senha do keystore e a senha da chave (no `keytool -genkeypair` o prompt pede ambas — pode usar a mesma).

> **Guarde o `release.jks` num cofre seguro (1Password, Bitwarden, KeePass).** Sem ele, todas as atualizações futuras quebram a assinatura — Google Play e Android instalado rejeitam o APK. **Perder o keystore = republicar app com novo `applicationId`.**

#### 2.2 Codificar em base64

```bash
# Linux/macOS
base64 -w0 release.jks > release.jks.base64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) > release.jks.base64
```

Copie o conteúdo do arquivo (uma linha contínua) para o secret `KEYSTORE_BASE64`.

#### 2.3 Configurar `signingConfigs` no Gradle

Edite `android/app/build.gradle` (uma vez):

```gradle
android {
    // ... (config existente)

    signingConfigs {
        release {
            // Lê do gradle.properties no CI (escrito on-the-fly pelo workflow).
            // Em build local, defina os mesmos campos no
            // ~/.gradle/gradle.properties OU android/gradle.properties.
            if (project.hasProperty('RELEASE_KEYSTORE_PATH')) {
                storeFile     file(RELEASE_KEYSTORE_PATH)
                storePassword RELEASE_KEYSTORE_PASSWORD
                keyAlias      RELEASE_KEY_ALIAS
                keyPassword   RELEASE_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            // ... (config existente)
            signingConfig signingConfigs.release
        }
    }
}
```

Build local de release:

```bash
# adicionar em ~/.gradle/gradle.properties (NÃO commitar)
RELEASE_KEYSTORE_PATH=/caminho/absoluto/para/release.jks
RELEASE_KEYSTORE_PASSWORD=xxx
RELEASE_KEY_ALIAS=linka
RELEASE_KEY_PASSWORD=xxx

# build
cd android && ./gradlew assembleRelease
```

### 3. Configurar secrets do GitHub

Repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token do passo 1.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID do passo 1.3 |
| `CLOUDFLARE_PAGES_PROJECT` | (opcional) Nome do projeto Pages, se diferente de `linka-speedtest` |
| `KEYSTORE_BASE64` | Conteúdo do arquivo do passo 2.2 |
| `KEYSTORE_PASSWORD` | Senha do keystore (passo 2.1) |
| `KEY_ALIAS` | Alias da chave (passo 2.1, ex.: `linka`) |
| `KEY_PASSWORD` | Senha da chave (passo 2.1) |

Pronto. A próxima tag `v*` que você empurrar dispara o pipeline completo.

---

## Trocar de target de deploy

O `release.yml` assume **Cloudflare Pages** como default. Para outros targets:

### Vercel

Substitua a etapa "Deploy to Cloudflare Pages" por:

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    vercel-args: '--prod'
```

### Netlify

```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v3
  with:
    publish-dir: dist
    production-deploy: true
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID:    ${{ secrets.NETLIFY_SITE_ID }}
```

### Estático em S3 / GCS / Azure Blob

Use as actions oficiais do provider e aponte para `dist/`.

---

## Operação no dia a dia

### Pull request

1. Push em qualquer branch.
2. CI (`ci.yml`) roda em ~3-5 min: lint + test + build + upload de `dist/`.
3. Cheque o badge na PR. Vermelho = quebra. Verde = pode mergear.

### Release

1. Mude `package.json` para nova versão e abra PR.
2. Após merge em `main`, crie tag local e empurre:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
3. `release.yml` dispara em paralelo dois jobs:
   - **PWA** (~5 min) — build + deploy em Cloudflare Pages. URL produção atualizada.
   - **APK** (~10-15 min) — `cap sync android` + `gradlew assembleRelease` + upload no GitHub Release.
4. Vá em **Releases** no GitHub. O APK assinado está anexado. Baixe e teste em devices reais.

### APK manual (sem CI)

Continua suportado:

```bash
npm run android:apk
# saída: builds/apk/linka-speedtest-X.Y.Z-{type}-{date}-{hash}.apk
```

Esse fluxo respeita a regra do `GuiaOrganizacaoPastas.md` (versionName + versionCode + tipo + data/hora + hash). O CI gera nome simplificado `linka-speedtest-X.Y.Z-release.apk` porque o anexo do Release já inclui a tag.

---

## Troubleshooting

### `KEYSTORE_BASE64` parece corrompido

Comum: `base64` em macOS quebra linhas a cada 76 chars. Use `base64 -b0` (BSD) ou `base64 -w0` (GNU). A flag `-w0` (sem wrap) é o que evita a quebra.

### "APK não encontrado" no job apk

A signingConfig falhou silenciosamente — Gradle deixa um `app-release-unsigned.apk` no lugar. Cheque:

1. Os 4 secrets de keystore foram preenchidos.
2. O snippet `signingConfigs` está em `android/app/build.gradle`.
3. O alias bate com o que você usou no `keytool -genkeypair`.

### Cloudflare Pages: "Project not found"

O projeto precisa **existir** no dashboard Cloudflare antes do primeiro deploy. O wrangler-action não cria projeto novo (é por design).

### Tag empurrada mas workflow não rodou

Verifique se a tag começa com `v` (`v1.2.0`, não `1.2.0`). O filtro `tags: ['v*']` exige o prefixo.
