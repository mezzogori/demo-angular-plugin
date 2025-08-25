import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { execSync } from 'child_process';

type Config = {
  // Base (reusable for other projects)
  basePluginSlug: string;        // es: "companyoffer-app"
  basePluginName: string;        // es: "CompanyOffer App"
  description: string;
  version: string;
  author: string;
  authorUri: string;
  pluginUri?: string;
  textDomain?: string;           // se non dato, = slug

  // Angular
  ngProjectName: string;                            // es: "companyoffer-app"
  distBrowserPath: string;                          // es: ./dist/companyoffer-app/browser
  srcEnvDir: string;                                // es: ./src/environments
  runNgBuild: boolean;                              // True to make the ng Build launch to him
  commonNgBuildArgs?: string[];                     // es: ["--base-href","./"]

  // Generazione ambienti
  environments: Array<{
    key: 'prod' | 'stage' | 'dev';
    label: 'PROD' | 'STAGE' | 'DEV';               // For the name Plugin
    configuration: 'production' | 'development';   // Angular CLI configuration
    // If there is Environment. <FileKey> .ts will be modified there; Otherwise Environment.ts
    fileKey?: 'prod' | 'stage' | 'dev' | '';       // '' = environment.ts
  }>;

  // Identificatori unici per ambiente (consigliato: true)
  uniquePerEnvIdentifiers: boolean;

  // Output
  outDir: string;                                   // es: ./wp-plugin-build
};

const config: Config = {
  basePluginSlug: 'demo-plugin-wp',
  basePluginName: 'demo Plugin WP',
  description: 'Incorpora la build Angular in WordPress tramite shortcode.',
  version: '1.1.0',
  author: 'Enrico Mezzogori',
  authorUri: 'https://example.com',
  pluginUri: 'https://example.com/demo-plugin-wp',
  textDomain: undefined,

  ngProjectName: 'demo-plugin-wp',
  distBrowserPath: path.resolve('dist/demo-plugin-wp/browser'),
  srcEnvDir: path.resolve('src/environments'),
  runNgBuild: true,
  commonNgBuildArgs: ['--base-href', './'],

  environments: [
    { key: 'prod',  label: 'PROD',  configuration: 'production',  fileKey: 'prod'  },
    { key: 'stage', label: 'STAGE', configuration: 'production',  fileKey: 'stage' },
    { key: 'dev',   label: 'DEV',   configuration: 'development', fileKey: 'dev'      },
  ],

  uniquePerEnvIdentifiers: true,
  outDir: path.resolve('wp-plugin-build'),
};

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
async function copyDir(src: string, dest: string, exclude: RegExp = /\.(map)$/i) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (exclude.test(e.name)) continue;
    if (e.isDirectory()) await copyDir(s, d, exclude);
    else if (e.isFile()) await fs.copyFile(s, d);
  }
}
async function zipDir(srcDir: string, outZipPath: string, rootFolderName: string) {
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));
    archive.pipe(output);
    archive.directory(srcDir, rootFolderName);
    archive.finalize();
  });
}
function detectEnvFilePath(envKey: 'prod' | 'stage' | 'dev' | '') {
  if (envKey === '') return path.join(config.srcEnvDir, 'environment.ts');
  const candidate = path.join(config.srcEnvDir, `environment.${envKey}.ts`);
  return existsSync(candidate) ? candidate : path.join(config.srcEnvDir, 'environment.ts');
}
async function readText(p: string) {
  return fs.readFile(p, 'utf8');
}
async function writeText(p: string, content: string) {
  await fs.writeFile(p, content, 'utf8');
}

/**
 * Sostituisce il valore della proprietà ambient: '...'
 * Ritorna una funzione di ripristino che riporta il file com’era.
 */
async function setAmbientInFile(filePath: string, newAmbient: 'prod'|'stage'|'dev') {
  const original = await readText(filePath);
  const replaced = original.replace(
    /(\bambient\s*:\s*)['"`][^'"`]+['"`]/,
    `$1'${newAmbient}'`
  );
  if (original === replaced) {
    // Se non trova ambient, prova ad aggiungerlo dentro l’oggetto export const environment = { ... }
    const injected = original.replace(
      /(export\s+const\s+environment\s*=\s*\{)/,
      `$1\n  ambient: '${newAmbient}',`
    );
    await writeText(filePath, injected);
  } else {
    await writeText(filePath, replaced);
  }
  return async () => writeText(filePath, original);
}

async function parseCurrentAmbient(): Promise<string | null> {
  try {
    const primary = detectEnvFilePath('');
    const txt = await readText(primary);
    const m = txt.match(/\bambient\s*:\s*['"`]([^'"`]+)['"`]/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function withEnvSuffix<T extends string>(base: T, env: 'prod'|'stage'|'dev') {
  return `${base}-${env}` as T;
}
function pluginNameWithLabel(baseName: string, label: string) {
  return `${baseName} (${label})`;
}
function makeIdentifiers(baseSlug: string, env: 'prod'|'stage'|'dev', unique: boolean) {
  const slug = unique ? withEnvSuffix(baseSlug, env) : baseSlug;
  const shortcodeBase = baseSlug.replace(/-/g, '_');
  const shortcode = unique ? `${shortcodeBase}_${env}` : shortcodeBase;

  const constPrefix = slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');   // es: COMPANYOFFER_APP_STAGE
  const funcPrefix  = slug.replace(/[^a-zA-Z0-9]/g, '_');              // es: companyoffer_app_stage
  const handlePref  = slug.replace(/[^a-z0-9]/g, '-');                 // es: companyoffer-app-stage

  return { slug, shortcode, constPrefix, funcPrefix, handlePref };
}

// ───────────────────────────────────────────────────────────────────────────────
// Templating PHP (funzioni/const uniche per evitare collisioni tra plugin)
// ───────────────────────────────────────────────────────────────────────────────
function phpTemplate(params: {
  pluginName: string;
  pluginSlug: string;
  shortcode: string;
  textDomain: string;
  version: string;
  author: string;
  authorUri: string;
  pluginUri?: string;
  description: string;
  constPrefix: string; // es: COMPANYOFFER_APP_STAGE
  funcPrefix: string;  // es: companyoffer_app_stage
  handlePref: string;  // es: companyoffer-app-stage
}) {
  const c = params;
  return `<?php
/**
 * Plugin Name:       ${c.pluginName}
 * Plugin URI:        ${c.pluginUri ?? ''}
 * Description:       ${c.description}
 * Version:           ${c.version}
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            ${c.author}
 * Author URI:        ${c.authorUri}
 * Text Domain:       ${c.textDomain}
 */

if (!defined('ABSPATH')) { exit; }

define('${c.constPrefix}_VERSION', '${c.version}');
define('${c.constPrefix}_SLUG',    '${c.pluginSlug}');
define('${c.constPrefix}_SHORTCODE', '${c.shortcode}');
define('${c.constPrefix}_PUBLIC_DIR', plugin_dir_path(__FILE__) . 'public/');
define('${c.constPrefix}_PUBLIC_URL', plugins_url('public/', __FILE__));

function ${c.funcPrefix}_glob_first($pattern) {
    $matches = glob($pattern);
    if (!$matches || empty($matches)) return null;
    natsort($matches);
    return array_pop($matches);
}

// aggiunge defer a TUTTI gli handle che iniziano con "${c.handlePref}-"
add_filter('script_loader_tag', function($tag, $handle) {
    if (strpos($handle, '${c.handlePref}-') === 0) {
        $tag = str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

function ${c.funcPrefix}_render_shortcode($atts = []) {
    $atts = shortcode_atts([
        'id'    => '${c.pluginSlug}-root',
        'class' => '${c.pluginSlug}',
        'tag'   => 'app-root',
    ], $atts, ${c.constPrefix}_SHORTCODE);

    $runtime   = ${c.funcPrefix}_glob_first(${c.constPrefix}_PUBLIC_DIR . 'runtime*.js');
    $polyfills = ${c.funcPrefix}_glob_first(${c.constPrefix}_PUBLIC_DIR . 'polyfills*.js');
    $main      = ${c.funcPrefix}_glob_first(${c.constPrefix}_PUBLIC_DIR . 'main*.js');
    $styles    = ${c.funcPrefix}_glob_first(${c.constPrefix}_PUBLIC_DIR . 'styles*.css');

    if (!$main) {
        return '<div class="notice notice-error">Build Angular non trovata in <code>public/</code>.</div>';
    }

    if ($styles) {
        wp_register_style('${c.handlePref}-styles', ${c.constPrefix}_PUBLIC_URL . basename($styles), [], @filemtime($styles) ?: ${c.constPrefix}_VERSION);
        wp_enqueue_style('${c.handlePref}-styles');
    }

    $inlineBefore = "(function(){"
      . "var base=document.querySelector('base')||document.createElement('base');"
      . "base.href='" . esc_js(${c.constPrefix}_PUBLIC_URL) . "';"
      . "if(!base.parentNode){document.head.appendChild(base);} "
      . "window.WP_PLUGIN_PUBLIC_URL='" . esc_js(${c.constPrefix}_PUBLIC_URL) . "';"
      . "})();";

    if ($runtime) {
        wp_register_script('${c.handlePref}-runtime', ${c.constPrefix}_PUBLIC_URL . basename($runtime), [], @filemtime($runtime) ?: ${c.constPrefix}_VERSION, true);
        wp_add_inline_script('${c.handlePref}-runtime', $inlineBefore, 'before');
        wp_enqueue_script('${c.handlePref}-runtime');
    }

    if ($polyfills) {
        wp_register_script('${c.handlePref}-polyfills', ${c.constPrefix}_PUBLIC_URL . basename($polyfills), $runtime ? ['${c.handlePref}-runtime'] : [], @filemtime($polyfills) ?: ${c.constPrefix}_VERSION, true);
        wp_enqueue_script('${c.handlePref}-polyfills');
    }

    $deps = [];
    if ($polyfills) { $deps[] = '${c.handlePref}-polyfills'; }
    elseif ($runtime) { $deps[] = '${c.handlePref}-runtime'; }

    wp_register_script('${c.handlePref}-main', ${c.constPrefix}_PUBLIC_URL . basename($main), $deps, @filemtime($main) ?: ${c.constPrefix}_VERSION, true);
    if (!$runtime && !$polyfills) {
        wp_add_inline_script('${c.handlePref}-main', $inlineBefore, 'before');
    }
    wp_enqueue_script('${c.handlePref}-main');

    $tag = preg_replace('/[^a-zA-Z0-9\\-]/', '', (string)$atts['tag']);
    $id = esc_attr($atts['id']);
    $class = esc_attr($atts['class']);
    return "<{$tag} id=\\"{$id}\\" class=\\"{$class}\\"></{$tag}>";
}
add_shortcode(${c.constPrefix}_SHORTCODE, '${c.funcPrefix}_render_shortcode');
`;
}

function readmeTemplate({ pluginName, version, author, shortcode }: { pluginName: string, version: string, author: string, shortcode: string }) {
  return `=== ${pluginName} ===
Contributors: ${author}
Tags: angular, spa
Requires at least: 6.1
Tested up to: 6.6
Stable tag: ${version}
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Incorpora la build Angular in WordPress tramite shortcode.

== Usage ==
1. Carica il plugin .zip su WordPress e attivalo.
2. Crea una pagina e inserisci lo shortcode [${shortcode}].
3. Consigliato: build Angular con "--base-href ./".
`;
}
function uninstallTemplate() {
  return `<?php
// Nessun dato persistente da rimuovere.
if (!defined('WP_UNINSTALL_PLUGIN')) { exit; }`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Build orchestrator
// ───────────────────────────────────────────────────────────────────────────────
async function main() {
  const currentAmbient = await parseCurrentAmbient().catch(() => null);
  console.log('Ambient rilevato da environment.ts:', currentAmbient ?? '(non trovato)');

  await ensureDir(config.outDir);

  for (const env of config.environments) {
    console.log('\n────────────────────────────────────────');
    console.log(`↪ Costruisco variante: ${env.key.toUpperCase()} (${env.configuration})`);
    const envFile = detectEnvFilePath(env.fileKey ?? '');
    console.log('  • File ambiente usato:', path.relative(process.cwd(), envFile));

    // Imposta ambient nel file target e ripristina dopo
    const restore = await setAmbientInFile(envFile, env.key);
    try {
      if (config.runNgBuild) {
        const commonArgs = config.commonNgBuildArgs?.join(' ') ?? '';
        const cmd = `npx ng build ${config.ngProjectName} --configuration ${env.configuration} ${commonArgs}`;
        console.log('  • execute:', cmd);
        execSync(cmd, { stdio: 'inherit' });
      } else {
        console.log('  • Salto ng build (runNgBuild=false), userò la dist esistente.');
      }
    } finally {
      await restore(); // ripristina il file ambiente
    }

    // Identificatori per ambiente
    const ids = makeIdentifiers(config.basePluginSlug, env.key, config.uniquePerEnvIdentifiers);
    const pluginName = pluginNameWithLabel(config.basePluginName, env.label);
    const textDomain = (config.textDomain ?? config.basePluginSlug) + (config.uniquePerEnvIdentifiers ? `-${env.key}` : '');

    const pluginDir = path.join(config.outDir, ids.slug);
    const publicDir = path.join(pluginDir, 'public');

    // Ricrea cartella plugin specifica
    await fs.rm(pluginDir, { recursive: true, force: true }).catch(() => {});
    await ensureDir(publicDir);

    // Copia la build Angular attuale
    console.log('  • Copio build:', config.distBrowserPath, '→', publicDir);
    await copyDir(config.distBrowserPath, publicDir);

    // Scrivi file PHP/readme/uninstall
    const php = phpTemplate({
                              pluginName,
                              pluginSlug: ids.slug,
                              shortcode: ids.shortcode,
                              textDomain,
                              version: config.version,
                              author: config.author,
                              authorUri: config.authorUri,
                              pluginUri: config.pluginUri,
                              description: config.description,
                              constPrefix: ids.constPrefix,
                              funcPrefix: ids.funcPrefix,
                              handlePref: ids.handlePref,
                            });
    await fs.writeFile(path.join(pluginDir, `${ids.slug}.php`), php, 'utf8');
    await fs.writeFile(path.join(pluginDir, 'readme.txt'), readmeTemplate({ pluginName, version: config.version, author: config.author, shortcode: ids.shortcode }), 'utf8');
    await fs.writeFile(path.join(pluginDir, 'uninstall.php'), uninstallTemplate(), 'utf8');

    // Crea ZIP
    const zipPath = path.join(config.outDir, `${ids.slug}-${config.version}.zip`);
    console.log('  • Creo ZIP:', zipPath);
    await zipDir(pluginDir, zipPath, ids.slug);

    console.log(`  ✓ Variante ${env.key.toUpperCase()} pronta`);
  }

  console.log('\nTutto fatto!');
  console.log(`Output: ${config.outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
