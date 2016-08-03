/**
 * @fileoverview Constants and enums for the app.
 * @author jonlau@google.com (Jonathan Lau)
 */

var photowall = {};

/**
 * Default slideshow delay in milliseconds.
 * @const {number}
 */
photowall.DEFAULT_SLIDESHOW_DELAY = 5000;

/**
 * Default slideshow animation.
 * @const {string}
 */
photowall.DEFAULT_SLIDESHOW_ANIMATION = 'fadeIn';

/**
 * Selector for elements that are focusable on the main page. Sets the tabindex
 * of these elements to -1 when a paper-dialog is open, and back to 0 when it
 * closes. This is to prevent tabbing to elements under the paper-dialog while
 * it is open.
 * @const {string}
 */
photowall.TABINDEX_SELECTOR = 'paper-button, paper-fab, paper-icon-button';

/**
 * Enum for slideshow actions.
 * @enum {string}
 */
photowall.SlideshowAction = {
  ADD_IMAGE: 'addImage',
  REMOVE_IMAGE: 'removeImage',
  CHANGE_DELAY: 'changeDelay',
  CHANGE_ANIMATION: 'changeAnimation',
};
