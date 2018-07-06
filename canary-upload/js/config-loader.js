// api call to get the configs
const apiUrl =
  "https://zdzwc628de.execute-api.us-west-2.amazonaws.com/v1/config";
// Hoist our configs all the way up to the global scope like the hooligans we're forced to be
// will be an array of objects containing rows from database
const fetchedConfigs = fetch(apiUrl).then(async res => {
  const fetchedConfigs = await res.json();
  // populate our list
  const configDropdown = fetchedConfigs
    .map(config => {
      return `<button class="btn btn-secondary dropdown-item" type="button" onClick="loadConfig('${
        config.filename
      }')">${config.filename}</button>`;
    })
    .join("");
  // set our div to hold our dropdown
  document.querySelector("#configList").innerHTML = `
    <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Dropdown button
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            ${configDropdown}        
            </div>
        </div>`;
});
// console.log(fetchedConfigs)
