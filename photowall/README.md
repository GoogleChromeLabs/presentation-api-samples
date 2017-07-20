# Photowall: Presentation API Sample

This web app allows multiple controllers to collaboratively present a photo
slideshow on a presentation display via [Presentation API]
(https://w3c.github.io/presentation-api/). Each controller can add or remove
photos from Flickr to the slideshow. Image search is implemented using the
Flickr API and photos are loaded by the presentation display directly from
Flickr.

## Getting Started

### Install dependencies

With Node.js installed, run the following to install `gulp` and `bower`.

    npm install -g gulp bower && npm install && bower install

### Running the project locally

This starts a server locally and outputs an IP address you can use to test
locally.

    gulp serve

### Build and Vulcanize

This default gulp task builds the project for production. The optimized project
will be generated in the `dist` directory.

    gulp

## Live Demo

https://googlechrome.github.io/presentation-api-samples/photowall/

## Presentation API Support

Presentation API has been implemented in Google Cast for Education. Currently,
only one connection at a time is supported. Support for multiple connections and
other receivers will be coming in the future. Casting to other receivers will
fall back to mirroring mode until they are supported. To try out the demo, add
the [Google Cast for Education](https://chrome.google.com/webstore/detail/google-cast-for-education/bnmgbcehmiinmmlmepibeeflglhbhlea)
app to Chrome and launch it. For more help on setting up Google Cast for
Education, check out the [support page](https://support.google.com/edu/castforedu).

Presentation API is [enabled by default](https://www.chromestatus.com/feature/6676265876586496) on Chrome 51+.
