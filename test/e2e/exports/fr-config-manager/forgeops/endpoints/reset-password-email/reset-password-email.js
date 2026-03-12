const FIELDS = [
  "_id",
  "userName",
  "givenName",
  "sn",
  "mail"
];

const fqdn = "openam-trivir-demo1.forgeblocks.com/";

main();

function main() {
  var token = context.current.parent.parent.parent.parent.parent.token;
  var {
    userName,
  } = request.content
  var user = validateUser(userName);
  startJourney("ResetPassword", token, user._id)
  // SEND EMAIL IN JOURNEY/ THIS IS HERE TO SHOW HOW IN A SCRIPT
  //var journeyLink = "https://www.google.com"
  // var params = new Object();
  // params.templateName = "resetPasswordEmail";
  // params.to = user.mail;
  // params.object = { firstName: user.givenName, lastName: user.sn, link: journeyLink}
  // openidm.action("external/email", "sendTemplate", params)
  return user;
}

function startJourney(journeyName, token, userId) {
  var params = {
    url:
      "https://" +
      fqdn +
      "am/json/realms/root/realms/alpha/authenticate?authIndexType=service&authIndexValue=" +
      journeyName,
    method: "POST",
    headers: {
      userId: userId
    },
    authenticate: {
      type: "bearer",
      token: token,
    },
  };
  var response = openidm.action("external/rest", "call", params);
  return response;
}

function validateUser(userId) {
  var users = openidm.query("managed/alpha_user", {
    _queryFilter: `/userName eq '${userId}'`,
    _fields: FIELDS.join(","),
  });

  if (users.result.length === 0) {
    throw {
      code: 404,
      message: `No user found with the id '${userId}'`,
    };
  }

  return users.result[0];
}
