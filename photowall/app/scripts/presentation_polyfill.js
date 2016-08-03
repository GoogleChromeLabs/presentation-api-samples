/**
* @fileoverview Polyfill for Presentation API for Cast Streaming Receiver.
* @author jonlau@google.com (Jonathan Lau)
*/

(function() {

  'use strict';


  /**
   * An object to represent each presentation connection.
   * https://w3c.github.io/presentation-api/#interface-presentationconnection
   *
   * @constructor
   */
  var PresentationConnection = function() {

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
    // TODO(jonlau): Send a message to close the connection.
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
  var PresentationReceiver = function() {

    /**
     * The non-terminated set of presentation connections.
     *
     * @type {!Promise<PresentationConnectionList>}
     */
    this.connectionList = new Promise(function(resolve, reject) {
      var connectionList = new PresentationConnectionList();
      var connectionListResolved = false;
      window.addEventListener('message', function(e) {
        var message = e.data;
        switch (message.type) {
          case 'NEW_CONNECTION':
            var presentationConnection = new PresentationConnection();
            // TODO(jonlau): Set the id of the presentation connection.
            presentationConnection.id = '';
            // Set message origin and source for message channel.
            presentationConnection.messageOrigin_ = e.origin;
            presentationConnection.messageSource_ = e.source;
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
            connectionList.connections.forEach(function(connection) {
              if (connection.onmessage) {
                connection.onmessage(
                    new MessageEvent('message', {data: message.data}));
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
  var PresentationConnectionList = function() {

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

  navigator.presentation.receiver = new PresentationReceiver();

}).call(this);
