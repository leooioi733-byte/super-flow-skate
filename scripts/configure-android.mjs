import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const stylesPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'styles.xml');
const appGradlePath = path.join(androidDir, 'app', 'build.gradle');
const gradlePropsPath = path.join(androidDir, 'gradle.properties');
const localPropsPath = path.join(androidDir, 'local.properties');

if (!fs.existsSync(androidDir)) {
  console.error('Missing android/ directory. Run "npx cap add android" first.');
  process.exit(1);
}

// 1. Configure AndroidManifest.xml (landscape lock + GPU hardware acceleration)
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  if (!manifest.includes('android:hardwareAccelerated=')) {
    manifest = manifest.replace(
      '<application',
      '<application\n        android:hardwareAccelerated="true"',
    );
  }

  if (!manifest.includes('android:screenOrientation=')) {
    manifest = manifest.replace(
      'android:name=".MainActivity"',
      'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"',
    );
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
  console.log('Configured AndroidManifest.xml (sensorLandscape + hardwareAccelerated)');
}

// 2. Configure styles.xml for fullscreen immersive play
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  if (!styles.includes('android:windowFullscreen')) {
    styles = styles.replace(
      '<item name="windowNoTitle">true</item>',
      '<item name="windowNoTitle">true</item>\n        <item name="android:windowFullscreen">true</item>',
    );
  }
  fs.writeFileSync(stylesPath, styles, 'utf8');
  console.log('Configured styles.xml (fullscreen)');
}

// 3. Configure versionCode / versionName in app/build.gradle cleanly
if (fs.existsSync(appGradlePath)) {
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionName = pkg.version && pkg.version !== '0.0.0' ? pkg.version : '1.0.0';
  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER ?? '1', 10);
  const versionCode = Number.isFinite(runNumber) && runNumber > 0 ? runNumber : 1;

  let gradle = fs.readFileSync(appGradlePath, 'utf8');
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
  fs.writeFileSync(appGradlePath, gradle, 'utf8');
  console.log(`Configured app/build.gradle (versionCode=${versionCode}, versionName=${versionName})`);
}

// 4. Give Gradle JVM enough heap memory for reliable CI builds
if (fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, 'utf8');
  if (props.includes('org.gradle.jvmargs=')) {
    props = props.replace(/org\.gradle\.jvmargs=.*/, 'org.gradle.jvmargs=-Xmx2048m');
  } else {
    props += '\norg.gradle.jvmargs=-Xmx2048m\n';
  }
  fs.writeFileSync(gradlePropsPath, props, 'utf8');
  console.log('Configured gradle.properties (-Xmx2048m)');
}

// 5. Ensure android/local.properties points to ANDROID_HOME / ANDROID_SDK_ROOT when available
const sdkDir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (sdkDir && fs.existsSync(sdkDir)) {
  const normalized = sdkDir.replace(/\\/g, '/');
  fs.writeFileSync(localPropsPath, `sdk.dir=${normalized}\n`, 'utf8');
  console.log(`Configured local.properties (sdk.dir=${normalized})`);
}
