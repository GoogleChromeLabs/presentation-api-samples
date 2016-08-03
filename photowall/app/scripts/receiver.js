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
  var slideshow = {
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
  var imageSequence = 0;

  /**
   * Gets image sequence number.
   *
   * @function
   * @return {number} Increasing sequence number for giving IDs to images.
   */
  var getImageId = function() {
    // Return and increment imageSequence.
    return imageSequence++;
  };

  /**
   * Called when there is a new connection to keep track of.
   *
   * @function
   * @param {PresentationConnection} connection Presentation connection.
   */
  var addConnection = function(connection) {
    // Send the state of the slideshow through the connection.
    sendMessage(connection, slideshow);
    connection.onmessage = function(e) {
      var jsonMessage = JSON.parse(e.data);
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
  var addImage = function(image) {
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
  var removeImage = function(id) {
    return slideshow.images.some(function(image) {
      if (image.id == id) {
        var imageIndex = slideshow.images.indexOf(image);
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
  var changeDelay = function(delay) {
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
  var changeAnimation = function(animation) {
    slideshow.animation = animation;
  };

  /**
   * Sends a message through a connection.
   *
   * @function
   * @param {PresentationConnection} connection Presentation connection.
   * @param {(string|Object)} message Message to be sent.
   */
  var sendMessage = function(connection, message) {
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
  var broadcastMessage = function(message) {
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
  var nextImageTimeout = null;

  /**
   * Periodically cycles through images in the slideshow.
   *
   * @function
   */
  var showNextImage = function() {
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
      var currentImage = slideshow.images[slideshow.currentImageIndex];
      var img = new Image();
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
  var preloadNextImage = function() {
    var nextImageIndex = slideshow.currentImageIndex + 1;
    if (nextImageIndex >= slideshow.images.length) {
      nextImageIndex = 0;
    }
    if (slideshow.images.length > 1) {
      var nextImage = slideshow.images[nextImageIndex];
      var img = new Image();
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
