# Demo Plugin WP

A sophisticated Angular application that can be seamlessly integrated into WordPress sites as a plugin. This project demonstrates how to build, package, and deploy Angular applications as WordPress plugins with support for multiple environments.

## 🚀 Project Overview

This project transforms an Angular 20.2.1 application into WordPress plugins that can be distributed and installed on WordPress sites. The application is embedded using WordPress shortcodes and includes advanced build automation for multiple deployment environments.

## ✨ Features

- **Angular 20.2.1 Integration**: Modern Angular application with latest features
- **WordPress Plugin Generation**: Automated build process that creates ready-to-install WordPress plugins
- **Multi-Environment Support**: Separate builds for development, staging, and production
- **Shortcode Integration**: Easy embedding in WordPress posts and pages
- **Automated Build Scripts**: TypeScript-powered build automation
- **Asset Optimization**: Proper handling of Angular assets in WordPress context
- **Version Management**: Automatic versioning and release packaging
- **Plugin Isolation**: Environment-specific identifiers to avoid conflicts

## 🛠️ Technology Stack

- **Frontend**: Angular 20.2.1 with TypeScript 5.8
- **Styling**: SCSS with Angular's component styling
- **Build Tools**: Angular CLI, Node.js, TypeScript
- **Packaging**: Node.js archiver for ZIP generation
- **WordPress Integration**: PHP plugin architecture
- **Testing**: Karma with Jasmine

## 📁 Project Structure
demo-plugin-wp/ 
├── src/ # Angular application source │ 
├── app/ # Angular components and modules │ 
├── environments/ # Environment-specific configurations │ 
    └── styles.scss # Global styles 
├── scripts/ # Build automation scripts │ 
├── build-wp-plugin.ts # Main plugin build script │ 
└── release-wp.ts # Release management script 
├── wp-plugin-build/ # Generated WordPress plugins │ 
├── demo-plugin-wp-dev/ # Development environment plugin │ 
├── demo-plugin-wp-stage/ # Staging environment plugin │ 
├── demo-plugin-wp-prod/ # Production environment plugin │ 
└── *.zip # Packaged plugin files ├── public/ # Static assets 
└── dist/ # Angular build output



## 🚦 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm package manager
- WordPress development environment (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd demo-plugin-wp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/` to see the Angular application.

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build the Angular application |
| `npm run test` | Run unit tests via Karma |
| `npm run build:wp-plugin` | Generate WordPress plugins for all environments |
| `npm run release:wp` | Create production-ready plugin releases |

### Development Workflow

1. **Develop the Angular application** using standard Angular development practices
2. **Test locally** using `ng serve`
3. **Build WordPress plugins** using `npm run build:wp-plugin`
4. **Create releases** using `npm run release:wp`

## 🏗️ Build System

### Multi-Environment Build Process

The project includes a sophisticated build system that creates separate WordPress plugins for different environments:

#### Environment Configurations

- **Development**: Optimized for debugging with source maps
- **Staging**: Production-like build for testing
- **Production**: Optimized build for live deployment

#### Build Features

- **Automatic Angular compilation** for each environment
- **PHP plugin file generation** with environment-specific identifiers
- **Asset copying and optimization**
- **ZIP package creation** for easy distribution
- **Version management** across all environments

### Plugin Generation

The `build-wp-plugin.ts` script:
- Compiles Angular application for multiple environments
- Generates PHP plugin files with unique identifiers
- Copies assets to plugin directories
- Creates installable ZIP packages
- Handles environment-specific configurations

## 📦 WordPress Integration

### Plugin Structure

Each generated WordPress plugin contains:
- **Main PHP file**: Plugin registration and shortcode handling
- **Public directory**: Compiled Angular assets
- **Readme file**: WordPress plugin information
- **Uninstall script**: Clean removal functionality

### Shortcode Usage

After installing the plugin in WordPress, use the shortcode to embed the Angular application:

[demo_plugin_wp_dev]


### Shortcode Parameters

- `id`: HTML ID for the root element (default: `demo-plugin-wp-root`)
- `class`: CSS class for the root element (default: `demo-plugin-wp`)
- `tag`: Angular root component tag (default: `app-root`)

### WordPress Requirements

- WordPress 6.1 or higher
- PHP 7.4 or higher
- Modern web browser with JavaScript enabled

## 🔧 Configuration

### Build Configuration

The main configuration is in `scripts/build-wp-plugin.ts`:

```typescript
const config: Config = {
  basePluginSlug: 'demo-plugin-wp',
  basePluginName: 'demo Plugin WP',
  description: 'Incorpora la build Angular in WordPress tramite shortcode.',
  version: '1.1.0',
  author: 'Enrico Mezzogori',
  // ... other settings
};
```
### Environment Settings
Configure environments in the same file to control:
- Angular build configurations
- Plugin naming conventions
- Asset handling
- WordPress integration parameters

## 🎯 Advanced Features
### Unique Environment Identifiers
The build system generates unique identifiers for each environment to prevent conflicts when multiple versions are installed on the same WordPress site.
### Asset Management
- Automatic base URL configuration for WordPress context
- Deferred script loading for better performance
- CSS and JS file versioning for cache busting
- WordPress asset enqueueing integration

### Plugin Isolation
Each environment generates isolated WordPress plugins with unique:
- Function names
- Constant definitions
- Shortcode names
- Asset handles

## 🚀 Deployment
### Creating Releases
1. **Build all environments**:
   npm run build:wp-plugin
2. **Create release packages**: npm run release:wp
3. **Distribute ZIP files** from the `releases/` directory

### WordPress Installation
1. Upload the appropriate environment ZIP file to WordPress
2. Activate the plugin through the WordPress admin panel
3. Use the generated shortcode in posts or pages

## 🧪 Testing
### Unit Testing

npm run test

Runs the test suite using Karma and Jasmine with:
- Component testing
- Service testing
- Angular-specific test utilities

### WordPress Testing
1. Install the generated plugin on a test WordPress site
2. Verify shortcode functionality
3. Test asset loading and Angular application behavior

## 📝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (both Angular and WordPress integration)
5. Submit a pull request

## 🔐 Security Considerations
- All WordPress plugin files include proper security headers
- Asset URLs are properly escaped
- Shortcode attributes are sanitized
- Uninstall procedures clean up properly

## 📄 License
This project follows standard WordPress plugin licensing practices. Check the generated plugin files for specific license information.
## 🤝 Support
For issues and questions:
1. Check the WordPress plugin logs
2. Verify Angular build process
3. Test individual environment builds
4. Review WordPress compatibility requirements

## 📈 Version History
- **1.1.0**: Current version with multi-environment support
- Multi-environment build system
- Advanced WordPress integration
- Automated release process

**Built with ❤️ using Angular and WordPress integration best practices**
