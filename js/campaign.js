(function($) {
  var isFacebook = false
    , isInit = false;

  // Sniff facebook.
  // @TODO this isn't really reliable, maybe we can finetune it?
  if (window.self != window.top) {
    $('html').addClass('facebook');
    isFacebook = true; // Drupal.settings doesn't exist yet.
  }

  // socialite.facebook.js in the social module takes care of initializing
  // the Facebook SDK through fbAsyncInit(). Once it has been initalized,
  // the fb.init event is published with the help of jquery-tiny-pubsub.
  $.subscribe('fb.init', function() {
    isInit = true;

    if (isFacebook && FB.Canvas) {
      FB.Canvas.setAutoGrow();
      FB.Canvas.scrollTo(0, 0);
    }
  });

  // Load facebook network even on pages with widgets.
  if (!Socialite.networkReady('facebook')) {
    Socialite.appendNetwork(Socialite.networks.facebook);
  }

  Drupal.behaviors.campaign = {
    attach: function(context, settings) {
      Drupal.campaign.attachEvents();
      if (isFacebook) Drupal.campaign.executeQueue();
    }
  };

  Drupal.campaign = Drupal.campaign = {};

  /**
   * Listen to click events on fb-event elements. This works by adding a DOM
   * element with the class 'fb-event' as well ass all FB.ui properties as
   * data-attributes.
   *
   * Example:
   * <button class="fb-event" data-method="feed" data-link="http://www.google.com" data-description="Desc">Feed</button>
   * <button class="fb-event" data-method="apprequests" data-message="My message" data-title="Title">App request</button>
   * <button class="fb-event" data-method="send" data-link="http://www.google.com" data-description="Desc">Desc</button>
   */
  Drupal.campaign.attachEvents = function() {
    $('body').once('dialog').on('click', '.fb-event', function() {
      var $this = $(this);
      Drupal.campaign.run(function() {
        this.ui($this.data());
      });
    });
  };

 /**
  * Execute queued dialogs added through Drupal.
  */
  Drupal.campaign.executeQueue = function() {
    var settings = Drupal.settings.campaign;
    if (settings && settings.dialogs) {
      _.each(settings.dialogs, function(obj) {
        Drupal.campaign.run(function() {
          console.log(obj);
          this.ui(obj);
        });
      });
      // Empty the list not to prompt the user on possible AJAX requests.
      settings.dialogs = [];
    }
  };

  /**
   * Make sure the callback runs after FB has been inited.
   *
   * Usage:
   * Drupal.campaign.run(function() { this.ui({}); });
   */
  Drupal.campaign.run = function(callback) {
    if (isInit) return callback.call(FB);
    $.subscribe('fb.init', function() {
      callback.call(FB);
    });
  };

}(jQuery));
