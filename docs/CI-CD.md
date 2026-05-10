# CI/CD â€” linka SpeedTest

> Como a integraÃ§Ã£o contÃ­nua e o pipeline de release funcionam neste repositÃ³rio. Inclui o setup completo de secrets, geraÃ§Ã£o de keystore Android e configuraÃ§Ã£o da Cloudflare Pages.

---

## VisÃ£o geral

Dois workflows GitHub Actions vivem em `.github/workflows/`:

- **`ci.yml`** â€” roda em **todo push** e em PR contra `main`. Faz lint, testes Vitest e build do PWA. Sobe `dist/` como artefato (retenÃ§Ã£o 7 dias).
- **`release.yml`** â€” roda em **push de tag `v*`** (ex.: `v1.2.0`). Em paralelo:
  - Faz build do PWA e deploy em **Cloudflare Pages**.
  - Faz `cap sync android`, build de **APK assinado** e anexa ao GitHub Release.

A polÃ­tica de branch Ãºnica (`main`) continua valendo. Os workflows dispararem em qualquer branch protege casos limÃ­trofes (forks, branches experimentais locais) sem mudar a regra.

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

Pre-release: tag com hÃ­fen (`v1.2.0-rc.1`) â€” o GitHub Release marca como "prerelease" automaticamente.

---

## Setup inicial â€” UMA vez por repositÃ³rio

### 1. Cloudflare Pages

#### 1.1 Criar projeto

No dashboard Cloudflare â†’ **Workers & Pages** â†’ **Create application** â†’ **Pages** â†’ **Connect to Git** ou **Direct Upload**.

- Nome do projeto: `linkaSpeedtestPwa` (default usado pelos workflows; sobreponha via secret `CLOUDFLARE_PAGES_PROJECT` se quiser outro).
- Production branch: `main`.

Esse passo Ã© **manual** e roda apenas uma vez. O CI usa `wrangler pages deploy` para enviar artefatos a esse projeto jÃ¡ existente â€” a action nÃ£o cria projeto.

#### 1.2 Gerar API token

Cloudflare dashboard â†’ Ã­cone de perfil (canto superior direito) â†’ **My Profile** â†’ **API Tokens** â†’ **Create Token** â†’ template **"Edit Cloudflare Workers"** ou **Custom token** com:

- Permissions: **Account â†’ Cloudflare Pages â†’ Edit**.
- Account Resources: somente a conta dona do projeto Pages.

Copie o token (aparece uma vez).

#### 1.3 Account ID

Cloudflare dashboard â†’ qualquer pÃ¡gina da conta â†’ painel direito tem **Account ID**. Copie.

### 2. Keystore Android

#### 2.1 Gerar keystore (uma vez)

Em ambiente local com JDK instalado:

```bash
keytool -genkeypair -keystore release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias linka \
  -dname "CN=linka SpeedTest, OU=linka, O=linka, L=Sao Paulo, ST=SP, C=BR"
```

Anote a senha do keystore e a senha da chave (no `keytool -genkeypair` o prompt pede ambas â€” pode usar a mesma).

> **Guarde o `release.jks` num cofre seguro (1Password, Bitwarden, KeePass).** Sem ele, todas as atualizaÃ§Ãµes futuras quebram a assinatura â€” Google Play e Android instalado rejeitam o APK. **Perder o keystore = republicar app com novo `applicationId`.**

#### 2.2 Codificar em base64

```bash
# Linux/macOS
base64 -w0 release.jks > release.jks.base64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) > release.jks.base64
```

Copie o conteÃºdo do arquivo (uma linha contÃ­nua) para o secret `KEYSTORE_BASE64`.

#### 2.3 Configurar `signingConfigs` no Gradle

Edite `android/app/build.gradle` (uma vez):

```gradle
android {
    // ... (config existente)

    signingConfigs {
        release {
            // LÃª do gradle.properties no CI (escrito on-the-fly pelo workflow).
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
# adicionar em ~/.gradle/gradle.properties (NÃƒO commitar)
RELEASE_KEYSTORE_PATH=/caminho/absoluto/para/release.jks
RELEASE_KEYSTORE_PASSWORD=xxx
RELEASE_KEY_ALIAS=linka
RELEASE_KEY_PASSWORD=xxx

# build
cd android && ./gradlew assembleRelease
```

### 3. Configurar secrets do GitHub

RepositÃ³rio â†’ **Settings** â†’ **Secrets and variables** â†’ **Actions** â†’ **New repository secret**.

| Secret | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token do passo 1.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID do passo 1.3 |
| `CLOUDFLARE_PAGES_PROJECT` | (opcional) Nome do projeto Pages, se diferente de `linkaSpeedtestPwa` |
| `KEYSTORE_BASE64` | ConteÃºdo do arquivo do passo 2.2 |
| `KEYSTORE_PASSWORD` | Senha do keystore (passo 2.1) |
| `KEY_ALIAS` | Alias da chave (passo 2.1, ex.: `linka`) |
| `KEY_PASSWORD` | Senha da chave (passo 2.1) |

Pronto. A prÃ³xima tag `v*` que vocÃª empurrar dispara o pipeline completo.

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

### EstÃ¡tico em S3 / GCS / Azure Blob

Use as actions oficiais do provider e aponte para `dist/`.

---

## OperaÃ§Ã£o no dia a dia

### Pull request

1. Push em qualquer branch.
2. CI (`ci.yml`) roda em ~3-5 min: lint + test + build + upload de `dist/`.
3. Cheque o badge na PR. Vermelho = quebra. Verde = pode mergear.

### Release

1. Mude `package.json` para nova versÃ£o e abra PR.
2. ApÃ³s merge em `main`, crie tag local e empurre:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
3. `release.yml` dispara em paralelo dois jobs:
   - **PWA** (~5 min) â€” build + deploy em Cloudflare Pages. URL produÃ§Ã£o atualizada.
   - **APK** (~10-15 min) â€” `cap sync android` + `gradlew assembleRelease` + upload no GitHub Release.
4. VÃ¡ em **Releases** no GitHub. O APK assinado estÃ¡ anexado. Baixe e teste em devices reais.

### APK manual (sem CI)

Continua suportado:

```bash
npm run android:apk
# saÃ­da: builds/apk/linkaSpeedtestPwa-X.Y.Z-{type}-{date}-{hash}.apk
```

Esse fluxo respeita a regra do `GuiaOrganizacaoPastas.md` (versionName + versionCode + tipo + data/hora + hash). O CI gera nome simplificado `linkaSpeedtestPwa-X.Y.Z-release.apk` porque o anexo do Release jÃ¡ inclui a tag.

---

## Troubleshooting

### `KEYSTORE_BASE64` parece corrompido

Comum: `base64` em macOS quebra linhas a cada 76 chars. Use `base64 -b0` (BSD) ou `base64 -w0` (GNU). A flag `-w0` (sem wrap) Ã© o que evita a quebra.

### "APK nÃ£o encontrado" no job apk

A signingConfig falhou silenciosamente â€” Gradle deixa um `app-release-unsigned.apk` no lugar. Cheque:

1. Os 4 secrets de keystore foram preenchidos.
2. O snippet `signingConfigs` estÃ¡ em `android/app/build.gradle`.
3. O alias bate com o que vocÃª usou no `keytool -genkeypair`.

### Cloudflare Pages: "Project not found"

O projeto precisa **existir** no dashboard Cloudflare antes do primeiro deploy. O wrangler-action nÃ£o cria projeto novo (Ã© por design).

### Tag empurrada mas workflow nÃ£o rodou

Verifique se a tag comeÃ§a com `v` (`v1.2.0`, nÃ£o `1.2.0`). O filtro `tags: ['v*']` exige o prefixo.

