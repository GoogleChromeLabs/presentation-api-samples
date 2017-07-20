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
 * @fileoverview Main script for receiver app to set up an image slideshow
 * launched via the Presentation API.
 * @author jonlau@google.com (Jonathan Lau)
 */

(function() {

  /**
   * Keeps track of the current state of the slideshow:
   * list of images in the slideshow, slideshow delay in milliseconds, and
   * index of the current image shown in the slideshow.
   *
   * @type {Object}
   */
  const slideshow = {
    images: [],
    delay: photowall.DEFAULT_SLIDESHOW_DELAY,
    animation: photowall.DEFAULT_SLIDESHOW_ANIMATION,
    currentImageIndex: 0,
  };

  /**
   * Image sequence number for giving IDs to images. Increments when an ID is
   * assigned to an image. Used to indicate which image to remove from the
   * slideshow as there may be more than one of the same image.
   *
   * @type {number}
   */
  let imageSequence = 0;

  /**
   * Gets image sequence number.
   *
   * @function
   * @return {number} Increasing sequence number for giving IDs to images.
   */
  const getImageId = function() {
    // Return and increment imageSequence.
    return imageSequence++;
  };

  /**
   * Called when there is a new connection to keep track of.
   *
   * @function
   * @param {PresentationConnection} connection Presentation connection.
   */
  const addConnection = function(connection) {
    // Send the state of the slideshow through the connection.

    connection.onconnect = function() {
      sendMessage(connection, slideshow);
    };
    connection.onmessage = function(e) {
      const jsonMessage = JSON.parse(e.data);
      switch (jsonMessage.action) {
        case photowall.SlideshowAction.ADD_IMAGE:
          addImage(jsonMessage.data);
          break;
        case photowall.SlideshowAction.REMOVE_IMAGE:
          removeImage(jsonMessage.data);
          break;
        case photowall.SlideshowAction.CHANGE_DELAY:
          changeDelay(jsonMessage.data);
          break;
        case photowall.SlideshowAction.CHANGE_ANIMATION:
          changeAnimation(jsonMessage.data);
          break;
      }
      // Broadcast the state of the slideshow to all connections.
      broadcastMessage(slideshow);
    };
  };

  /**
   * Adds an image to the slideshow.
   *
   * @function
   * @param {Object} image Object representation of the image.
   */
  const addImage = function(image) {
    // Attach an ID to the image.
    image.id = getImageId();
    // Push image to slideshow.
    slideshow.images.push(image);
    // Preload image if it is the next image on the slideshow.
    if (slideshow.currentImageIndex + 2 == slideshow.images.length) {
      preloadNextImage();
    }
    // Cycle to next image immediate if this is the first image.
    if (slideshow.images.length == 1) {
      showNextImage();
    }
  };

  /**
   * Removes an image from the slideshow.
   *
   * @function
   * @param {number} id Image ID.
   * @return {boolean} True if an image was removed.
   */
  const removeImage = function(id) {
    return slideshow.images.some(function(image) {
      if (image.id == id) {
        const imageIndex = slideshow.images.indexOf(image);
        slideshow.images.splice(imageIndex, 1);
        if (imageIndex < slideshow.currentImageIndex) {
          slideshow.currentImageIndex--;
        }
        if (imageIndex == slideshow.currentImageIndex) {
          slideshow.currentImageIndex--;
          showNextImage();
        }
        return true;
      }
    });
  };

  /**
   * Updates the slideshow delay.
   *
   * @function
   * @param {number} delay Delay time in milliseconds.
   */
  const changeDelay = function(delay) {
    slideshow.delay = delay;
    // Reset delay for current image.
    slideshow.currentImageIndex--;
    showNextImage();
  };

  /**
   * Updates the slideshow animation.
   *
   * @function
   * @param {string} animation Slideshow animation.
   */
  const changeAnimation = function(animation) {
    slideshow.animation = animation;
  };

  /**
   * Sends a message through a connection.
   *
   * @function
   * @param {PresentationConnection} connection Presentation connection.
   * @param {(string|Object)} message Message to be sent.
   */
  const sendMessage = function(connection, message) {

    if (typeof message == 'object') {
      message = JSON.stringify(message);
    }
    connection.send(message);
  };

  /**
   * Sends a message to all connections.
   *
   * @function
   * @param {(string|Object)} message Message to be sent.
   */
  const broadcastMessage = function(message) {

    navigator.presentation.receiver.connectionList.then(function(list) {
      list.connections.map(function(connection) {
        sendMessage(connection, message);
      });
    });
  };

  /**
   * Keeps track of timeout ID for cycling through images.
   *
   * @type {?number}
   */
  let nextImageTimeout = null;

  /**
   * Periodically cycles through images in the slideshow.
   *
   * @function
   */
  let showNextImage = function() {
    if (nextImageTimeout) {
      clearTimeout(nextImageTimeout);
    }
    // Increment image index.
    slideshow.currentImageIndex++;
    if (slideshow.currentImageIndex >= slideshow.images.length) {
      slideshow.currentImageIndex = 0;
    }
    // If there are no images in the queue, clear everything in the slideshow.
    if (slideshow.images.length == 0) {
      document.querySelector('#slideshow').innerHTML = '';
    } else {
      // Replace slideshow with current image.
      const currentImage = slideshow.images[slideshow.currentImageIndex];
      const img = new Image();
      img.src = currentImage.url;
      img.className = "animated " + slideshow.animation;
      // Remove old slideshow image after the new slideshow image has completed
      // its entrance animation.
      img.addEventListener('webkitAnimationEnd', function() {
        while (document.querySelector('#slideshow').childNodes.length > 1) {
          document.querySelector('#slideshow').removeChild(
              document.querySelector('#slideshow').firstChild);
        }
      });
      document.querySelector('#slideshow').appendChild(img);
      // Preload next image.
      preloadNextImage();
      // Set timeout for cycling to next image.
      nextImageTimeout = setTimeout(showNextImage, slideshow.delay);
    }
  };

  /**
   * Preloads the next image in the slideshow for smoother transition.
   * Although images were preloaded before, they might need to be fetched
   * again if there are many images in the slideshow and the browser is low
   * on memory.
   *
   * @function
   */
  const preloadNextImage = function() {
    let nextImageIndex = slideshow.currentImageIndex + 1;
    if (nextImageIndex >= slideshow.images.length) {
      nextImageIndex = 0;
    }
    if (slideshow.images.length > 1) {
      const nextImage = slideshow.images[nextImageIndex];
      const img = new Image();
      img.src = nextImage.url;
    }
  };

  // Handles each connection to the display.
  navigator.presentation.receiver.connectionList.then(function(list) {
    // Calls addConnection on each of the existing PresentationConnection.
    list.connections.map(function(connection) {
      addConnection(connection);
    });
    // Calls addConnection on every new PresentationConnection.
    list.onconnectionavailable = function(connections) {
      addConnection(connections[connections.length - 1]);
    };
  });

}).call(this);
