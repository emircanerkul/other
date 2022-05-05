## Drupal Design Systems

In this project, I demonstrate what design system are used and how works with Drupal.

To be able to do that, I used previously developed [themes](https://github.com/emircanerkul/psd-to-html)

##### Table of Contents

- [Setting Form Based Most Simplest Design System](#setting-form-based-most-simplest-design-system)
- [Component Based Design System](#component-based-design-system)
- [Atomic Design System with Emulsify](#atomic-design-system-with-emulsify)

### Setting Form-Based Most Simplest Design System

#### Startuprr

Startuprr Landing Page Theme is built for companies that only have one landing page and a contact form. In this theme, I
only used core theme functionality and the power of the twig tweak module to be able to get some Drupal settings easily.

Integrating plain HTML to drupal gives all power of drupal to your static website. With drupal's power, you can extend
your theme easily even if it's just one landing page. You can integrate your webform to any CRM application or you can
do anything with a well-knowledged drupal developer.

#### Startuprr ([Preview](https://raw.githubusercontent.com/emircanerkul/drupal-design-systems/master/startuprr/screenshot.png))

#### Startuprr Setting Form

![Startuprr Setting Form](https://raw.githubusercontent.com/emircanerkul/drupal-design-systems/master/startuprr-setting-form.gif)

### Component Based Design System

This approach is much more appropriate who have lots of similar pages/layouts but don't want to re-develop or re-update
the same component again and again. With that approach, you can reuse preexisting components on any page.

#### TTravel ([Preview](https://raw.githubusercontent.com/emircanerkul/drupal-design-systems/master/ttravel/screenshot.png))

#### TTravel Component Placement

Easy to reuse components with the power of paragraph module.

![TTravel Preview](https://raw.githubusercontent.com/emircanerkul/drupal-design-systems/master/ttravel/component-placement.png)

#### TTravel Component Structure

With the power of the Drupal Paragraph module, this approach is possible.
This [Patch](https://www.drupal.org/project/drupal/issues/3092496) is used for exploring and automatically including
sublibraries within theme folders.

![TTravel Preview](https://raw.githubusercontent.com/emircanerkul/drupal-design-systems/master/ttravel/component-structure.png)

### Atomic Design System with Emulsify

Atomic Design System is best for big companies that have lots of sub-websites or pages and want to use similar UI
components. For more detail please check the [Emulsify's Github Page](https://github.com/emulsify-ds/emulsify-drupal)

Thank You!
