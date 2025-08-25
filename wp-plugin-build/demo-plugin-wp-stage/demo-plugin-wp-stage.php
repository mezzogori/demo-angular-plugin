<?php
/**
 * Plugin Name:       demo Plugin WP (STAGE)
 * Plugin URI:        https://example.com/demo-plugin-wp
 * Description:       Incorpora la build Angular in WordPress tramite shortcode.
 * Version:           1.1.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Enrico Mezzogori
 * Author URI:        https://example.com
 * Text Domain:       demo-plugin-wp-stage
 */

if (!defined('ABSPATH')) { exit; }

define('DEMO_PLUGIN_WP_STAGE_VERSION', '1.1.0');
define('DEMO_PLUGIN_WP_STAGE_SLUG',    'demo-plugin-wp-stage');
define('DEMO_PLUGIN_WP_STAGE_SHORTCODE', 'demo_plugin_wp_stage');
define('DEMO_PLUGIN_WP_STAGE_PUBLIC_DIR', plugin_dir_path(__FILE__) . 'public/');
define('DEMO_PLUGIN_WP_STAGE_PUBLIC_URL', plugins_url('public/', __FILE__));

function demo_plugin_wp_stage_glob_first($pattern) {
    $matches = glob($pattern);
    if (!$matches || empty($matches)) return null;
    natsort($matches);
    return array_pop($matches);
}

// aggiunge defer a TUTTI gli handle che iniziano con "demo-plugin-wp-stage-"
add_filter('script_loader_tag', function($tag, $handle) {
    if (strpos($handle, 'demo-plugin-wp-stage-') === 0) {
        $tag = str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

function demo_plugin_wp_stage_render_shortcode($atts = []) {
    $atts = shortcode_atts([
        'id'    => 'demo-plugin-wp-stage-root',
        'class' => 'demo-plugin-wp-stage',
        'tag'   => 'app-root',
    ], $atts, DEMO_PLUGIN_WP_STAGE_SHORTCODE);

    $runtime   = demo_plugin_wp_stage_glob_first(DEMO_PLUGIN_WP_STAGE_PUBLIC_DIR . 'runtime*.js');
    $polyfills = demo_plugin_wp_stage_glob_first(DEMO_PLUGIN_WP_STAGE_PUBLIC_DIR . 'polyfills*.js');
    $main      = demo_plugin_wp_stage_glob_first(DEMO_PLUGIN_WP_STAGE_PUBLIC_DIR . 'main*.js');
    $styles    = demo_plugin_wp_stage_glob_first(DEMO_PLUGIN_WP_STAGE_PUBLIC_DIR . 'styles*.css');

    if (!$main) {
        return '<div class="notice notice-error">Build Angular non trovata in <code>public/</code>.</div>';
    }

    if ($styles) {
        wp_register_style('demo-plugin-wp-stage-styles', DEMO_PLUGIN_WP_STAGE_PUBLIC_URL . basename($styles), [], @filemtime($styles) ?: DEMO_PLUGIN_WP_STAGE_VERSION);
        wp_enqueue_style('demo-plugin-wp-stage-styles');
    }

    $inlineBefore = "(function(){"
      . "var base=document.querySelector('base')||document.createElement('base');"
      . "base.href='" . esc_js(DEMO_PLUGIN_WP_STAGE_PUBLIC_URL) . "';"
      . "if(!base.parentNode){document.head.appendChild(base);} "
      . "window.WP_PLUGIN_PUBLIC_URL='" . esc_js(DEMO_PLUGIN_WP_STAGE_PUBLIC_URL) . "';"
      . "})();";

    if ($runtime) {
        wp_register_script('demo-plugin-wp-stage-runtime', DEMO_PLUGIN_WP_STAGE_PUBLIC_URL . basename($runtime), [], @filemtime($runtime) ?: DEMO_PLUGIN_WP_STAGE_VERSION, true);
        wp_add_inline_script('demo-plugin-wp-stage-runtime', $inlineBefore, 'before');
        wp_enqueue_script('demo-plugin-wp-stage-runtime');
    }

    if ($polyfills) {
        wp_register_script('demo-plugin-wp-stage-polyfills', DEMO_PLUGIN_WP_STAGE_PUBLIC_URL . basename($polyfills), $runtime ? ['demo-plugin-wp-stage-runtime'] : [], @filemtime($polyfills) ?: DEMO_PLUGIN_WP_STAGE_VERSION, true);
        wp_enqueue_script('demo-plugin-wp-stage-polyfills');
    }

    $deps = [];
    if ($polyfills) { $deps[] = 'demo-plugin-wp-stage-polyfills'; }
    elseif ($runtime) { $deps[] = 'demo-plugin-wp-stage-runtime'; }

    wp_register_script('demo-plugin-wp-stage-main', DEMO_PLUGIN_WP_STAGE_PUBLIC_URL . basename($main), $deps, @filemtime($main) ?: DEMO_PLUGIN_WP_STAGE_VERSION, true);
    if (!$runtime && !$polyfills) {
        wp_add_inline_script('demo-plugin-wp-stage-main', $inlineBefore, 'before');
    }
    wp_enqueue_script('demo-plugin-wp-stage-main');

    $tag = preg_replace('/[^a-zA-Z0-9\-]/', '', (string)$atts['tag']);
    $id = esc_attr($atts['id']);
    $class = esc_attr($atts['class']);
    return "<{$tag} id=\"{$id}\" class=\"{$class}\"></{$tag}>";
}
add_shortcode(DEMO_PLUGIN_WP_STAGE_SHORTCODE, 'demo_plugin_wp_stage_render_shortcode');
