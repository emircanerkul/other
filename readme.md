## Drupal Gin Toolbar Extension

When I create a new theme that has a fixed or sticky menu, Drupal's default toolbar reduces experience due to wrong alignment or element order.

For fixing that problem I developed a chromium extension. With this extension, now I easily use the Drupal gin toolbar with excellent accessibility.

!['Preview'](https://raw.githubusercontent.com/emircanerkul/drupal-gin-toolbar-extension/master/preview.png)

This module has been tested with https://www.drupal.org/project/gin_toolbar

## My Starter Drupal 9 Modules & Configs that compatible with this chromium extension
***
#### GIN THEME INSTALL & ENABLE
* `composer require 'drupal/gin'`
* `drush theme:enable gin`
* `drush config-set system.theme admin gin -y`
* `drush config-set gin.settings enable_darkmode false -y`
* `drush config-set gin.settings classic_toolbar horizontal -y`
* `drush config-set node.settings use_admin_theme true -y`

#### GIN LOGIN
* `composer require 'drupal/gin_login'`
* `drush en gin_login`

#### ADMIN TOOLBAR
* `composer require 'drupal/admin_toolbar'`
* `drush en admin_toolbar -y`
* `drush en admin_toolbar_tools`

#### GIN TOOLBAR
* `composer require 'drupal/gin_toolbar'`
* `drush en gin_toolbar -y`

#### COFFEE
* `composer require 'drupal/coffee:^1.2'`
* `drush en coffee -y`

#### DISABLE REGISTER
* `drush config-set user.settings register admin_only -y`

#### COMPOSER UPDATE
* `drush composer update`

#### CLEAR CACHE
* `drush cr`
***

## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)