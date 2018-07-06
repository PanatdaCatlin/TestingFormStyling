// TODO: this should work. That'd be nice
// $('#sign-in-modal').modal('show');
// $('#login-button').click(async () => {
//     const authenticationData = {
//         Username : $('#username-input').val() + '@wheelhousedmg.com',
//         Password : $('#password-input').val(),
//     };
//     const authenticationDetails = AWS.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
//     const poolData = {
//         UserPoolId : 'us-west-2_hhLMG8LIc',
//         ClientId : '69q0qeel51ddkmpu4msm3qe0be'
//     };
//     const userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
//     const userData = {
//         Username : authenticationData.Username,
//         Pool : userPool
//     };
//     const cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser(userData);
//     cognitoUser.authenticateUser(authenticationDetails, {
//         onSuccess: function (result) {
//             console.log('access token + ' + result.getAccessToken().getJwtToken());
//             /// Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer
//             console.log('idToken + ' + result.idToken.jwtToken);
//         },

//         onFailure: function(err) {
//             alert(err);
//         },

//     });
// })

// Default rows (examples etc)
const defaultHotData = [
  [
    "URL",
    "Element",
    "Element Name",
    "JS Test",
    "JS Test Name",
    "RegEx Test",
    "RegEx Name"
  ],
  [
    "example.com",
    "each item goes",
    "Header",
    "test.js",
    "Stock Check",
    "/asdf/gi",
    "asdf check"
  ],
  [
    "",
    "on a new line",
    "Bio blurb",
    "anothertest.js",
    "Modal Check",
    "/10294/gi",
    "10294 check"
  ],
  ["", "so you can check", "Footer", "", "", "/adsgh/gi", "Some other name"],
  ["", "multiple things", "Script tag", "", "", "", ""]
];

const ss = document.getElementById("spreadsheet");
// TODO: column width should maybe be locked. Does HoT have wrapping options?
const settings = {
  // make a new array in case it tries to modify the default one
  data: [...defaultHotData],
  rowHeaders: true,
  colHeaders: true,
  minRows: 26,
  manualColumnResize: true,
  manualRowResize: true,
  contextMenu: true,
  wordWrap: true,
  autoRowSize: false,
  colWidths: 125,
  //colWidths: [175, 175, 175, 175, 175, 175, 175],
  // afterChange: (change, source) => {
  //     if (source === 'loadData') {
  //         return;
  //     }
  //     //  console.log(change)
  // },
  cells: (row, col, prop) => {
    const cellProperties = {};
    if (row === 0) {
      cellProperties.renderer = firstRowRenderer; // uses function directly
    } else if (row >= 1 && row <= 4) {
      cellProperties.readOnly = true;
    } else if (col === 5) {
      // RegEx Test col
      cellProperties.validator = function(val, cb) {
        let valid = false;
        try {
          new RegExp(val); // throws error on invalid RegEx
          cb(true);
        } catch (error) {
          console.error(error);
          alert("Your RegEx is invalid");
          cb(false);
        }
      };
    } else if (col === 3) {
      // JS Test col
      cellProperties.validator = function(val, cb) {
        const jsRegex = new RegExp(/.*(\.js)$/i);
        if (val.length === 0 || jsRegex.test(val)) cb(true);
        else {
          alert("Your JS test does not end with .js");
          cb(false);
        }
      };
    }
    return cellProperties;
  }
};

function firstRowRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.style.fontWeight = "bold";
  td.style.color = "#359487";
  td.style.background = "white";
}

const hot = new Handsontable(ss, settings);
hot.render();

async function loadConfig(filename) {
  AWS.config.update({
    // credentials: new AWS.CognitoIdentityCredentials({
    //     IdentityPoolId: 'us-west-2_hhLMG8LIc'
    // })
    accessKeyId: "AKIAJNY2XGYEQAUYGTTQ",
    secretAccessKey: "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",
    region: "us-west-2"
  });
  // get specific config
  const s3Params = {
    Bucket: "canary-upload",
    Key: "submitted-configs/" + filename
  };

  const config = JSON.parse(
    await new AWS.S3()
      .getObject(s3Params)
      .promise()
      .then(res => res.Body.toString())
  );
  // turn config from object to array of arrays
  const newData = [];
  for (const url of Object.keys(config)) {
    // each URL
    // config saving only counts row[0] from URL to URL, so we can just have the URL be its own row
    newData.push([url, null, null, null, null, null, null]);
    const longest = { count: 0, item: "" };
    const urlObj = config[url];
    // find the longest array
    for (const key of Object.keys(urlObj)) {
      if (urlObj[key].length > longest.count) {
        longest.count = urlObj[key].length;
        longest.item = key;
      }
    }

    // Loop over the longest array, creating rows. Build them using the other two arrays (via index) when possible
    // Very ternary heavy, but if you break it out it's fairly straightforward
    urlObj[longest.item].forEach((item, index) => {
      const newRow = [];
      if (longest.item === "elements") {
        newData.push([
          null,
          item.element,
          item.name,
          urlObj.js_tests && urlObj.js_tests[index]
            ? urlObj.js_tests[index].js_test
            : null,
          urlObj.js_tests && urlObj.js_tests[index]
            ? urlObj.js_tests[index].name
            : null,
          urlObj.regex_tests && urlObj.regex_tests[index]
            ? urlObj.regex_tests[index].regex
            : null,
          urlObj.regex_tests && urlObj.regex_tests[index]
            ? urlObj.regex_tests[index].name
            : null
        ]);
      } else if (longest.item === "js_tests") {
        newData.push([
          null,
          urlObj.elements && urlObj.elements[index]
            ? urlObj.elements[index].element
            : null,
          urlObj.elements && urlObj.elements[index]
            ? urlObj.elements[index].name
            : null,
          item.js_test,
          item.name,
          urlObj.regex_tests && urlObj.regex_tests[index]
            ? urlObj.regex_tests[index].regex
            : null,
          urlObj.regex_tests && urlObj.regex_tests[index]
            ? urlObj.regex_tests[index].name
            : null
        ]);
      } else if (longest.item === "regex_tests") {
        newData.push([
          null,
          urlObj.elements && urlObj.elements[index]
            ? urlObj.elements[index].element
            : null,
          urlObj.elements && urlObj.elements[index]
            ? urlObj.elements[index].name
            : null,
          urlObj.js_tests && urlObj.js_tests[index]
            ? urlObj.js_tests[index].js_test
            : null,
          urlObj.js_tests && urlObj.js_tests[index]
            ? urlObj.js_tests[index].name
            : null,
          item.regex,
          item.name
        ]);
      } else {
        console.error("whaaaat");
      }
    });
  } // end each URL
  // populate table (keeping the default rows, since those are locked anyway)
  hot.loadData([...defaultHotData, ...newData]);

  // set client/project/folder/user
  const [client, project, folder, userName] = filename.split("/");
  document.querySelector("#config-client-name").value = client;
  document.querySelector("#config-project").value = project;
  document.querySelector("#config-folder").value = folder;
  document.querySelector("#username-input").value = userName.split(".")[0];
  document.querySelector("#active-checkbox").value = config.checked; // true/false
} // loadConfig


