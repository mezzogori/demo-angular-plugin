<?php
/**
 * Plugin Name:       demo Plugin WP (PROD)
 * Plugin URI:        https://example.com/demo-plugin-wp
 * Description:       Incorpora la build Angular in WordPress tramite shortcode.
 * Version:           1.1.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Enrico Mezzogori
 * Author URI:        https://example.com
 * Text Domain:       demo-plugin-wp-prod
 */

if (!defined('ABSPATH')) { exit; }

define('DEMO_PLUGIN_WP_PROD_VERSION', '1.1.0');
define('DEMO_PLUGIN_WP_PROD_SLUG',    'demo-plugin-wp-prod');
define('DEMO_PLUGIN_WP_PROD_SHORTCODE', 'demo_plugin_wp_prod');
define('DEMO_PLUGIN_WP_PROD_PUBLIC_DIR', plugin_dir_path(__FILE__) . 'public/');
define('DEMO_PLUGIN_WP_PROD_PUBLIC_URL', plugins_url('public/', __FILE__));

function demo_plugin_wp_prod_glob_first($pattern) {
    $matches = glob($pattern);
    if (!$matches || empty($matches)) return null;
    natsort($matches);
    return array_pop($matches);
}

// aggiunge defer a TUTTI gli handle che iniziano con "demo-plugin-wp-prod-"
add_filter('script_loader_tag', function($tag, $handle) {
    if (strpos($handle, 'demo-plugin-wp-prod-') === 0) {
        $tag = str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

function demo_plugin_wp_prod_render_shortcode($atts = []) {
    $atts = shortcode_atts([
        'id'    => 'demo-plugin-wp-prod-root',
        'class' => 'demo-plugin-wp-prod',
        'tag'   => 'app-root',
    ], $atts, DEMO_PLUGIN_WP_PROD_SHORTCODE);

    $runtime   = demo_plugin_wp_prod_glob_first(DEMO_PLUGIN_WP_PROD_PUBLIC_DIR . 'runtime*.js');
    $polyfills = demo_plugin_wp_prod_glob_first(DEMO_PLUGIN_WP_PROD_PUBLIC_DIR . 'polyfills*.js');
    $main      = demo_plugin_wp_prod_glob_first(DEMO_PLUGIN_WP_PROD_PUBLIC_DIR . 'main*.js');
    $styles    = demo_plugin_wp_prod_glob_first(DEMO_PLUGIN_WP_PROD_PUBLIC_DIR . 'styles*.css');

    if (!$main) {
        return '<div class="notice notice-error">Build Angular non trovata in <code>public/</code>.</div>';
    }

    if ($styles) {
        wp_register_style('demo-plugin-wp-prod-styles', DEMO_PLUGIN_WP_PROD_PUBLIC_URL . basename($styles), [], @filemtime($styles) ?: DEMO_PLUGIN_WP_PROD_VERSION);
        wp_enqueue_style('demo-plugin-wp-prod-styles');
    }

    $inlineBefore = "(function(){"
      . "var base=document.querySelector('base')||document.createElement('base');"
      . "base.href='" . esc_js(DEMO_PLUGIN_WP_PROD_PUBLIC_URL) . "';"
      . "if(!base.parentNode){document.head.appendChild(base);} "
      . "window.WP_PLUGIN_PUBLIC_URL='" . esc_js(DEMO_PLUGIN_WP_PROD_PUBLIC_URL) . "';"
      . "})();";

    if ($runtime) {
        wp_register_script('demo-plugin-wp-prod-runtime', DEMO_PLUGIN_WP_PROD_PUBLIC_URL . basename($runtime), [], @filemtime($runtime) ?: DEMO_PLUGIN_WP_PROD_VERSION, true);
        wp_add_inline_script('demo-plugin-wp-prod-runtime', $inlineBefore, 'before');
        wp_enqueue_script('demo-plugin-wp-prod-runtime');
    }

    if ($polyfills) {
        wp_register_script('demo-plugin-wp-prod-polyfills', DEMO_PLUGIN_WP_PROD_PUBLIC_URL . basename($polyfills), $runtime ? ['demo-plugin-wp-prod-runtime'] : [], @filemtime($polyfills) ?: DEMO_PLUGIN_WP_PROD_VERSION, true);
        wp_enqueue_script('demo-plugin-wp-prod-polyfills');
    }

    $deps = [];
    if ($polyfills) { $deps[] = 'demo-plugin-wp-prod-polyfills'; }
    elseif ($runtime) { $deps[] = 'demo-plugin-wp-prod-runtime'; }

    wp_register_script('demo-plugin-wp-prod-main', DEMO_PLUGIN_WP_PROD_PUBLIC_URL . basename($main), $deps, @filemtime($main) ?: DEMO_PLUGIN_WP_PROD_VERSION, true);
    if (!$runtime && !$polyfills) {
        wp_add_inline_script('demo-plugin-wp-prod-main', $inlineBefore, 'before');
    }
    wp_enqueue_script('demo-plugin-wp-prod-main');

    $tag = preg_replace('/[^a-zA-Z0-9\-]/', '', (string)$atts['tag']);
    $id = esc_attr($atts['id']);
    $class = esc_attr($atts['class']);
    return "<{$tag} id=\"{$id}\" class=\"{$class}\"></{$tag}>";
}
add_shortcode(DEMO_PLUGIN_WP_PROD_SHORTCODE, 'demo_plugin_wp_prod_render_shortcode');
