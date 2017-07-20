/*
  Copyright 2017 Google Inc. All Rights Reserved.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
      http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
 /**
 * @fileoverview Main file for the Presentation API slideshow application.
 * @author jonlau@google.com (Jonathan Lau)
 */

(function(document) {
  'use strict';

  const app = document.querySelector('#app');

  /**
   * Keeps track of the state of the slideshow.
   *
   * @type {Object} Object representing the slideshow state.
   */
  app.slideshow = {
    images: [],
    delay: photowall.DEFAULT_SLIDESHOW_DELAY,
    animation: photowall.DEFAULT_SLIDESHOW_ANIMATION,
    currentImageIndex: null,
  };

  /**
   * Returns true if there displays available but we are not connected to any.
   *
   * @function
   * @param {boolean} displaysAvailable True if there are presentation displays
   *     available to connect to.
   * @param {boolean} displayConnected True if we are connected to any displays.
   * @return {boolean} True if displays are available but we are not connected
   *     to any of them.
   */
  app.availableAndNotConnected = function(displaysAvailable, displayConnected) {
    return displaysAvailable && !displayConnected;
  };

  /**
   * Displays a toast message.
   *
   * @function
   * @param {string} message Toast message content.
   */
  app.toast = function(message) {
    app.$.toast.text = message;
    app.$.toast.show();
  };

  /**
   * Opens the image picker dialog.
   *
   * @function
   */
  app.openImagePicker = function() {
    app.$.imagePickerDialog.open();
  };

  /**
   * Called when an image is clicked.
   *
   * @function
   * @param {Event} e Event for when an image is clicked.
   */
  app.selectPhoto = function(e) {
    const photo = e.model.item;
    app.$.presentation.send({
      action: photowall.SlideshowAction.REMOVE_IMAGE,
      data: photo.id,
    });
  };

  // Imports are loaded and elements have been registered.
  window.addEventListener('WebComponentsReady', function() {

    // Add event listener for when a presentation display is connected.
    app.$.presentation.addEventListener('connect', function() {
      app.toast('Connected to a display.');
    });

    // Add event listener for when a presentation display is disconnected.
    app.$.presentation.addEventListener('disconnect', function() {
      app.toast('Disconnected from display.');
      // Reset slideshow when disconnecting.
      app.slideshow = {
        images: [],
        delay: photowall.DEFAULT_SLIDESHOW_DELAY,
        animation: photowall.DEFAULT_SLIDESHOW_ANIMATION,
        currentImageIndex: null,
      };
      // Close any paper-dialog that may be open. We expect to have at most
      // one open at any time.
      document.querySelectorAll('paper-dialog').forEach(function(paperDialog) {
        paperDialog.close();
      });
    });

    // Add event listener for when a message is received.
    app.$.presentation.addEventListener('message', function(e) {
      app.slideshow = JSON.parse(e.detail);
    });

    // Accessibility for when the options dialog and image picker dialog
    // is opened. Prevents tabbing to items under paper-dialogs. Also stops
    // screen readers from reading text under paper-dialogs.
    document.querySelectorAll('paper-dialog').forEach(function(dialog) {
      dialog.addEventListener('iron-overlay-opened', function(e) {
        // Ensure that the iron-overlay-opened event is fired from the
        // paper-dialog and not from one of its children.
        if (e.target == dialog) {
          dialog.querySelector('[autofocus]').focus();
          if (app.$.main) {
            app.$.main.setAttribute('aria-hidden', true);
            app.$.main.querySelectorAll(photowall.TABINDEX_SELECTOR)
                .forEach(function(el) {
              el.tabIndex = -1;
            });
          }
        }
      });
      dialog.addEventListener('iron-overlay-closed', function(e) {
        if (e.target == dialog && app.$.main) {
          app.$.main.setAttribute('aria-hidden', false);
          app.$.main.querySelectorAll(photowall.TABINDEX_SELECTOR)
              .forEach(function(el) {
            el.tabIndex = 0;
          });
        }
      });
    });

    // Add event listener for when an image is selected from the Flickr gallery.
    app.$.flickrGallery.addEventListener('selectimage', function(e) {
      // Close image picker dialog.
      app.$.imagePickerDialog.close();
      // Send a message through the presentation channel.
      app.$.presentation.send({
        action: photowall.SlideshowAction.ADD_IMAGE,
        // The event detail contains information on the selected photo.
        // The object has two properties: the image url and thumbnail url.
        data: e.detail,
      });
    });

    // Reset search query when the image picker dialog is closed.
    app.$.imagePickerDialog.addEventListener('iron-overlay-closed', function() {
      app.$.flickrGallery.query = '';
    });

    // Add event listener for when the selected item is changed in the
    // slideshow delay listbox.
    app.$.slideshowDelayListbox.addEventListener('iron-activate', function(e) {
      const prevDelay = app.slideshow.delay;
      const newDelay = parseInt(e.detail.selected);
      // Update presentation display only if there is a change in delay.
      if (prevDelay != newDelay) {
        app.$.presentation.send({
          action: photowall.SlideshowAction.CHANGE_DELAY,
          data: newDelay,
        });
      }
    });

    // Add event listener for when the selected item is changed in the
    // slideshow animation listbox.
    app.$.slideshowAnimationListbox
        .addEventListener('iron-activate', function(e) {
      const prevAnimation = app.slideshow.animation;
      const newAnimation = e.detail.selected;
      // Update presentation display only if there is a change in animation.
      if (prevAnimation != newAnimation) {
        app.$.presentation.send({
          action: photowall.SlideshowAction.CHANGE_ANIMATION,
          data: newAnimation,
        });
      }
    });

  });

})(document);
