<?php
/**
 * Plugin Name:       demo Plugin WP (DEV)
 * Plugin URI:        https://example.com/demo-plugin-wp
 * Description:       Incorpora la build Angular in WordPress tramite shortcode.
 * Version:           1.1.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Enrico Mezzogori
 * Author URI:        https://example.com
 * Text Domain:       demo-plugin-wp-dev
 */

if (!defined('ABSPATH')) { exit; }

define('DEMO_PLUGIN_WP_DEV_VERSION', '1.1.0');
define('DEMO_PLUGIN_WP_DEV_SLUG',    'demo-plugin-wp-dev');
define('DEMO_PLUGIN_WP_DEV_SHORTCODE', 'demo_plugin_wp_dev');
define('DEMO_PLUGIN_WP_DEV_PUBLIC_DIR', plugin_dir_path(__FILE__) . 'public/');
define('DEMO_PLUGIN_WP_DEV_PUBLIC_URL', plugins_url('public/', __FILE__));

function demo_plugin_wp_dev_glob_first($pattern) {
    $matches = glob($pattern);
    if (!$matches || empty($matches)) return null;
    natsort($matches);
    return array_pop($matches);
}

// aggiunge defer a TUTTI gli handle che iniziano con "demo-plugin-wp-dev-"
add_filter('script_loader_tag', function($tag, $handle) {
    if (strpos($handle, 'demo-plugin-wp-dev-') === 0) {
        $tag = str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

function demo_plugin_wp_dev_render_shortcode($atts = []) {
    $atts = shortcode_atts([
        'id'    => 'demo-plugin-wp-dev-root',
        'class' => 'demo-plugin-wp-dev',
        'tag'   => 'app-root',
    ], $atts, DEMO_PLUGIN_WP_DEV_SHORTCODE);

    $runtime   = demo_plugin_wp_dev_glob_first(DEMO_PLUGIN_WP_DEV_PUBLIC_DIR . 'runtime*.js');
    $polyfills = demo_plugin_wp_dev_glob_first(DEMO_PLUGIN_WP_DEV_PUBLIC_DIR . 'polyfills*.js');
    $main      = demo_plugin_wp_dev_glob_first(DEMO_PLUGIN_WP_DEV_PUBLIC_DIR . 'main*.js');
    $styles    = demo_plugin_wp_dev_glob_first(DEMO_PLUGIN_WP_DEV_PUBLIC_DIR . 'styles*.css');

    if (!$main) {
        return '<div class="notice notice-error">Build Angular non trovata in <code>public/</code>.</div>';
    }

    if ($styles) {
        wp_register_style('demo-plugin-wp-dev-styles', DEMO_PLUGIN_WP_DEV_PUBLIC_URL . basename($styles), [], @filemtime($styles) ?: DEMO_PLUGIN_WP_DEV_VERSION);
        wp_enqueue_style('demo-plugin-wp-dev-styles');
    }

    $inlineBefore = "(function(){"
      . "var base=document.querySelector('base')||document.createElement('base');"
      . "base.href='" . esc_js(DEMO_PLUGIN_WP_DEV_PUBLIC_URL) . "';"
      . "if(!base.parentNode){document.head.appendChild(base);} "
      . "window.WP_PLUGIN_PUBLIC_URL='" . esc_js(DEMO_PLUGIN_WP_DEV_PUBLIC_URL) . "';"
      . "})();";

    if ($runtime) {
        wp_register_script('demo-plugin-wp-dev-runtime', DEMO_PLUGIN_WP_DEV_PUBLIC_URL . basename($runtime), [], @filemtime($runtime) ?: DEMO_PLUGIN_WP_DEV_VERSION, true);
        wp_add_inline_script('demo-plugin-wp-dev-runtime', $inlineBefore, 'before');
        wp_enqueue_script('demo-plugin-wp-dev-runtime');
    }

    if ($polyfills) {
        wp_register_script('demo-plugin-wp-dev-polyfills', DEMO_PLUGIN_WP_DEV_PUBLIC_URL . basename($polyfills), $runtime ? ['demo-plugin-wp-dev-runtime'] : [], @filemtime($polyfills) ?: DEMO_PLUGIN_WP_DEV_VERSION, true);
        wp_enqueue_script('demo-plugin-wp-dev-polyfills');
    }

    $deps = [];
    if ($polyfills) { $deps[] = 'demo-plugin-wp-dev-polyfills'; }
    elseif ($runtime) { $deps[] = 'demo-plugin-wp-dev-runtime'; }

    wp_register_script('demo-plugin-wp-dev-main', DEMO_PLUGIN_WP_DEV_PUBLIC_URL . basename($main), $deps, @filemtime($main) ?: DEMO_PLUGIN_WP_DEV_VERSION, true);
    if (!$runtime && !$polyfills) {
        wp_add_inline_script('demo-plugin-wp-dev-main', $inlineBefore, 'before');
    }
    wp_enqueue_script('demo-plugin-wp-dev-main');

    $tag = preg_replace('/[^a-zA-Z0-9\-]/', '', (string)$atts['tag']);
    $id = esc_attr($atts['id']);
    $class = esc_attr($atts['class']);
    return "<{$tag} id=\"{$id}\" class=\"{$class}\"></{$tag}>";
}
add_shortcode(DEMO_PLUGIN_WP_DEV_SHORTCODE, 'demo_plugin_wp_dev_render_shortcode');
