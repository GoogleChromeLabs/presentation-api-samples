/**
 * @fileoverview Polyfill for Presentation API for Cast for EDU
 * @author jonlau@google.com (Jonathan Lau)
 * @author budnampet@google.com (Pet Ramanudom)
 */

/* If the receiver page is launched in the app in 1-UA mode, then there is no
 * need to redefine the following Presentation API functions. The polyfill
 * should effectively be skipped.
 */
if (!navigator.presentation.receiver) {
  (() => {

    'use strict';


    /**
     * An object to represent each presentation connection.
     * https://w3c.github.io/presentation-api/#interface-presentationconnection
     *
     * @constructor
     */
    const PresentationConnection = function() {

      /**
       * Specifies the presentation connection's presentation identifier.
       *
       * @type {string}
       */
      this.id;

      /**
       * Represents the presentation connection's current state.
       *
       * @type {!PresentationConnectionState}
       */
      this.state = 'connected';

      /**
       * Called when a connection is made.
       *
       * @type {?EventHandler}
       */
      this.onconnect = null;

      /**
       * Called on connection close.
       *
       * @type {?function(PresentationConnectionClosedEvent)}
       */
      this.onclose = null;

      /**
       * Called on termination.
       *
       * @type {?EventHandler}
       */
      this.onterminate = null;

      /**
       * Called when a message is received.
       *
       * @type {?function(MessageEvent)}
       */
      this.onmessage = null;


      /**
       * Message origin for webview.postMessage().
       *
       * @private
       * @type {string}
       */
      this.messageOrigin_;

      /**
       * Message source for webview.postMessage().
       *
       * @private
       * @type {Object}
       */
      this.messageSource_;

    };



    /**
     * Starts closing the presentation connection.
     * https://w3c.github.io/presentation-api/#closing-a-presentationconnection
     */
    PresentationConnection.prototype.close = function() {
      // TODO: Send a message to close the connection.
      if (this.state != 'close') {
        this.state = 'closed';
        if (this.onclose) {
          this.onclose(new Event('close', {reason: 'closed'}));
        }
      }
    };

    /**
     * Terminates a presentation in a receiving browsing context.
     * https://w3c.github.io/presentation-api/#terminating-a-presentation-in-a-receiving-browsing-context
     */
    PresentationConnection.prototype.terminate = function() {
      this.state = 'terminated';
      window.close();
    };

    /**
     * Sends a message through a presentation connection.
     * https://w3c.github.io/presentation-api/#sending-a-message-through-presentationconnection
     *
     * @param {string} message
     */
    PresentationConnection.prototype.send = function(message) {
      this.messageSource_.postMessage(message, this.messageOrigin_);
    };


    /**
     * Allows receiver to communicate with senders.
     * https://w3c.github.io/presentation-api/#interface-presentationreceiver
     *
     * @constructor
     */
    const PresentationReceiver = function() {

      /**
       * The non-terminated set of presentation connections.
       *
       * @type {!Promise<PresentationConnectionList>}
       */
      this.connectionList = new Promise((resolve, reject) => {
        const connectionList = new PresentationConnectionList();
        let connectionListResolved = false;
        window.addEventListener('message', e => {
          const message = e.data;
          switch (message.type) {
            case 'NEW_CONNECTION':
              const presentationConnection = new PresentationConnection();
              // TODO(jonlau): Set the id of the presentation connection.
              presentationConnection.id = '';
              // Set message origin and source for message channel.
              presentationConnection.messageOrigin_ = e.origin;
              presentationConnection.messageSource_ = e.source;
              // Populate the connection list.
              connectionList.connections.push(presentationConnection);
              if (!connectionListResolved) {
                connectionListResolved = true;
                resolve(connectionList);
              } else if (connectionList.onconnectionavailable) {
                // Fire connectionavailable event if the Promise is already
                // resolved with the connection list.
                connectionList.onconnectionavailable(presentationConnection);
              }
              break;
            case 'APP_MESSAGE':
              connectionList.connections.forEach(connection => {
                if (connection.onmessage) {
                  connection.onmessage(
                      new MessageEvent('message', {data: message.data})
                  );
                }
              });
              break;
          }
        });
      });
    };

    /**
     * Interface to keep track of presentation connections.
     * https://w3c.github.io/presentation-api/#interface-presentationconnectionlist
     *
     * @constructor
     */
    const PresentationConnectionList = function() {

      /**
       * The non-terminated set of presentation connections.
       *
       * @type {!Array<PresentationConnection>}
       */
      this.connections = [];

      /**
       * Called when a connection is available.
       *
       * @type {?function(Array<PresentationConnection>)}
       */
      this.onconnectionavailable = null;

    };
      // Must assign new PresentationReceiver object to the
      // navigation.presentation's receiver using the object constructor because
      // both navigation.presentation and navigation.presentation.receiver are
      // readonly attributes.
      Object.defineProperty(navigator,'presentation',
        {
          value: {receiver: new PresentationReceiver()},
        });
  }).call(this);
}
