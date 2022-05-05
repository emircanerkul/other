/**
 * @file
 * Web behaviors.
 */
(function (Drupal, $) {

    'use strict';

    Drupal.behaviors.carousel = {
        attach: function (context, settings) {
            $(context).find('body')
                .once('behaviors_carousel')
                .each(function () {
                    $('.slick').slick({
                        slidesToShow: 3,
                        dots: true,
                    });
                });
        }
    };

}(Drupal, jQuery));
