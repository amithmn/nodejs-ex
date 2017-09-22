(function($) {
  var messageList = $('.page #js-messages');

  function message(p_sMessage) {
    console.log('message ' + p_sMessage);
    //p_sMessage = "<li>" + p_sMessage + "</li>"
    //messageList.append(p_sMessage);
    var ul = document.getElementById("js-messages");
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(p_sMessage));
    //li.setAttribute("id", "element4"); // added line
    ul.appendChild(li);
  //alert(li.id);
  }

  function OnLinkedInAuth() {
    IN.API.Profile("me").result(ShowProfileData);
  }

  function ShowProfileData(profiles) {
    var member = profiles.values[0];
    var id = member.id;
    var firstName = member.firstName;
    var lastName = member.lastName;
    var photo = member.pictureUrl;
    var headline = member.headline;
    var ul = document.getElementById("js-messages");
    var li = document.createElement("li");
    var img = document.createElement('img');
    var p = document.createElement('p');
    p.innerHTML = "<b>" + firstName + " " + lastName + "</b><br/>works as " + headline;
    img.src = photo;
    img.id = id;
    li.appendChild(img);
    li.appendChild(p);
    ul.appendChild(li);
  //use information captured above
  }

  window.Linkedin = {
    init: function() {
      console.log('here');
      message('The Linkedin JS has loaded.');
      message('You can now login.');

      $('.IN-widget').bind('click', function() {
        message('You just clicked the Login Button');
        IN.Event.on(IN, "auth", OnLinkedInAuth);
      });
    },

    onAuthCallback: function() {
      message('You just logged in.');
      message('Will retrieve your info.');
    },
    onLogoutCallback: function() {
      message('You just logged out.');
    },
    userData: function(p_oUserInfo) {
      message('Your user data was received:');
      message(''
        + ' <img src="' + p_oUserInfo.pictureUrl + '" \/>'
        + p_oUserInfo.firstName + ' ' + p_oUserInfo.lastName
        + ' -- ' + p_oUserInfo.headline
        + ' (' + p_oUserInfo.id + ')'
      );
    }
  };
}(jQuery));
