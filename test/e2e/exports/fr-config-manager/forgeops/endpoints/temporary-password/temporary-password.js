const PASSWORD_SETTINGS = {
    NUM_WORDS: 2,
    MIN_WORD_LENGTH: 4,
    MAX_WORD_LENGTH: 10,
    ALLOWED_SPECIAL_CHARACTERS: "-#@?!$"
};

const FIELDS = [
  "_id",
  "userName",
];

const tempPasswordExpirationAttribute = "frUnindexedDate1";

main();

function main() {
  var {
    userName,
  } = request.content
  var userId = validateUser(userName);
  var tempPassword = resetPassword(userId);
  setTempPasswordExpiration(userId);
  return {tempPassword};
}

function resetPassword(userId) {
  setPasswordResetFlag(userId);
  var newPassword = generatePassword();
  openidm.patch(
      "managed/alpha_user/" + userId, null,[
      { operation: "replace", field: "password", value: newPassword }
  ]);
  return newPassword;
}

function generatePassword() {
  var words = identityServer
    .getProperty('esv.password.words')
    .split(',')
    .filter(w => w.length >= PASSWORD_SETTINGS.MIN_WORD_LENGTH && w.length <= PASSWORD_SETTINGS.MAX_WORD_LENGTH);
  var usedWords = [];
  for (var i = 0; i < PASSWORD_SETTINGS.NUM_WORDS; i++) {
    var randomWord;
    do {
      randomWord = words[randomInt(words.length)];
    } while (usedWords.includes(randomWord))
    usedWords.push(randomWord);
  }

  var capitalWordIndex = randomInt(PASSWORD_SETTINGS.NUM_WORDS);
  var password = 0 === capitalWordIndex ? toTitleCase(usedWords[0]) : usedWords[0];
  var allowedSpecialCharacters = PASSWORD_SETTINGS.ALLOWED_SPECIAL_CHARACTERS;
  for (var i = 1; i < PASSWORD_SETTINGS.NUM_WORDS; i++) {
    password += randomInt(10);
    password += allowedSpecialCharacters[randomInt(allowedSpecialCharacters.length - 1)];
    password += i === capitalWordIndex ? toTitleCase(usedWords[i]) : usedWords[i];
  }

  return password;
}

function randomInt(n) {
    return Math.floor(Math.random() * n);
}

function toTitleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function setTempPasswordExpiration(userId, expirationTimeInMinutes) {
  var expiration = getTempPasswordExpiration(expirationTimeInMinutes);
  openidm.patch("managed/alpha_user/" + userId, null, [
    {
      operation: "replace",
      field: tempPasswordExpirationAttribute,
      value: expiration
    },
  ]);
}

function getTempPasswordExpiration(expirationTimeInMinutes) {
  if (!expirationTimeInMinutes) {
    expirationTimeInMinutes = 15;
  }
  return new Date(Date.now() + 1000 * 60 * expirationTimeInMinutes).toISOString(); // 15 minutes
}

function setPasswordResetFlag(userId) {
  openidm.patch("managed/alpha_user/" + userId, null, [
    { operation: "replace", field: "frUnindexedString1", value: "true" }, // todo: should this property be updated to a boolean?
  ]);
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
