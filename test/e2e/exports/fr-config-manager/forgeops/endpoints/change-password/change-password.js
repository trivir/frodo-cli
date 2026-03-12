const FIELDS = [
  "_id",
  "userName",
];

main();

function main() {
  var {
    userName,
    newPassword
  } = request.content
  var userId = validateUser(userName);
  resetPassword(userId, newPassword);
  return {
    userId: userId
  };
}

function resetPassword(userId, newPassword) {
  openidm.patch(
      "managed/alpha_user/" + userId, null,[
      { operation: "replace", field: "password", value: newPassword }
  ], null, null);
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

  return users.result[0]._id;
}
