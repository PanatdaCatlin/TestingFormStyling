document.getElementById("submit-button").onclick = async () => {
    // array of arrays representing our table
    let ssData = hot.getData();
    ssData = ssData.splice(5); // remove our header and example etc rows
    // remove empty rows. If a row is all null, it will not be included
    ssData = ssData.filter(row => row.filter(cell => cell).length > 0);
    // now we have only the data we want. Just transform it and save it to S3. The rest will be taken care of via a Lambda on a trigger
    const fileJSON = {
      urls: {}
      /* sticking with underscores since this is going in the database
              "url": {
               "elements": [{"element": "a > b > c", "name": "ABC"}],
               "js_tests": [{"js_test": "sometest.js", "name": "Some Test"}],
               "regex_tests": [{"regex": "/glhf/gi", "name": "JSON and RegEx Yay"}]
              }
              */
    };
  
    let currentUrl = "";
    let invalid = false;
  
    const clientName = document.getElementById("config-client-name").value;
  
    const project = document.getElementById("config-project").value;
  
    const folder = document.getElementById("config-folder").value;
  
    const userName = document.getElementById("username-input").value;
  
    if (!clientName || !project || !folder || !userName) {
      // pop a modal or alert
      console.error("Missing required data: client name, project, or folder");
      invalid = true;
    }
  
    for (const row of ssData) {
      if (row[0]) currentUrl = row[0];
  
      if (!fileJSON.urls[currentUrl]) {
        fileJSON.urls[currentUrl] = {
          elements: [],
          js_tests: [],
          regex_tests: []
        };
      }
      // everything must have a name
      if ((row[1] && !row[2]) || (row[3] && !row[4]) || (row[5] && !row[6]))
        invalid = true;
      else {
        if (row[1] && row[2])
          fileJSON.urls[currentUrl].elements.push({
            element: row[1],
            name: row[2]
          });
        if (row[3] && row[4])
          fileJSON.urls[currentUrl].js_tests.push({
            js_test: row[3],
            name: row[4]
          });
        if (row[5] && row[6]) {
          // do our validation here
          fileJSON.urls[currentUrl].regex_tests.push({
            regex: row[5],
            name: row[6]
          });
        }
      }
    }
    if (invalid) {
      // pop a modal or alert
      alert(
        `Something was invalid, received: client name ${clientName} | project ${project} | folder ${folder} | user ${userName}`
      );
    } else {
      // remove unused keys so we don't have to parse it all down later
      for (const url of Object.keys(fileJSON.urls)) {
        if (fileJSON.urls[url].elements.length < 1)
          delete fileJSON.urls[url].elements;
        if (fileJSON.urls[url].js_tests.length < 1)
          delete fileJSON.urls[url].js_tests;
        if (fileJSON.urls[url].regex_tests.length < 1)
          delete fileJSON.urls[url].regex_tests;
      }
  
      // set our active flag
      fileJSON.active = document.querySelector("#active-checkbox").checked;
  
      // need this to upload
      AWS.config.update({
        // credentials: new AWS.CognitoIdentityCredentials({
        //     IdentityPoolId: 'us-west-2_hhLMG8LIc'
        // })
        accessKeyId: "AKIAJNY2XGYEQAUYGTTQ",
        secretAccessKey: "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",
        region: "us-west-2"
      });
  
      // AWS.config.loadFromPath('./AWSCredentials.json')
      // const roleArn = 'arn:aws:iam::211560526318:role/canary-url-upload-s3';
      const s3Params = {
        Bucket: "canary-upload",
        Key: `submitted-configs/${clientName}/${project}/${folder}/${userName}.json`,
        // Tagging: encodeURIComponent(`Billing=SEO-Sonar&Product=Sonar-Canary&Client=${clientName}`),
        Body: JSON.stringify(fileJSON)
      };
  
      try {
        const s3 = new AWS.S3();
        await s3.upload(s3Params).promise();
        const s3TagParams = {
          Bucket: "canary-upload",
          Key: `submitted-configs/${clientName}/${project}/${folder}/${userName}.json`,
          Tagging: {
            TagSet: [
              { Key: "Billing", Value: "SEO-Sonar" },
              { Key: "Product", Value: "Sonar-Canary" },
              { Key: "Client", Value: clientName }
            ]
          }
        };
  
        await s3.putObjectTagging(s3TagParams).promise();
      } catch (error) {
        // TODO: modal instead of alert
        alert(error);
      }
    }
  };