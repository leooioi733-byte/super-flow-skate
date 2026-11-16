# FLOW SKATE — Instalação por APK via GitHub

O projeto já está configurado com **Capacitor 8 Android** e **GitHub Actions** para gerar o arquivo `.apk` pronto para instalar no celular.

## Como baixar e instalar pelo GitHub

1. Envie o código para o seu repositório no GitHub (branch `main` ou `master`).
2. Abra a aba **Actions** no GitHub e selecione o workflow **Build Android APK** (ele inicia automaticamente a cada `push` ou pode ser iniciado manualmente em **Run workflow**).
3. Ao finalizar, baixe o arquivo **`FLOW-SKATE-android-apk`** na seção **Artifacts** (ou na aba **Releases** caso faça push de uma tag como `v1.0.0` ou marque a opção de Release manual).
4. Extraia o `.zip` (se baixado via Artifact) e toque em **`FLOW-SKATE-android.apk`** no Android para instalar (habilite *Instalar apps desconhecidos* se solicitado).

## Como gerar o APK localmente (opcional)

Requisitos: Node.js 22+, Java JDK 21 e Android SDK instalados.

```bash
npm install
npm run android:prepare
npm run android:apk
```

O APK gerado ficará em:
`android/app/build/outputs/apk/debug/app-debug.apk`
