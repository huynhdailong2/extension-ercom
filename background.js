
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type && msg.type == 'API_AJAX_HTML') {
    Promise.all(
      msg.urlList.map(urlObj =>
        fetch(urlObj.url).then(resp => resp.text().then(obj => {
          return { type: urlObj.type, colorName: urlObj?.colorName, text: obj }
        }))
      ))
      .then((data) => {
        console.log(data);
        sendResponse(data);
      });
    // (async function fetchApi() {
    //   let response = [];
    //   msg.urlList.forEach(function(urlObj){
    //     let url1 = urlObj.url;
    //     let res = await fetch(url1);
    //     let data = await res.text();
    //     response.push({ type: urlObj.type, text: data });
    //   });     
    //   return await sendResponse(response);
    // })();
  }
  chrome.storage.local.get(function (result) {
    console.log('result',result);
    if (result && result.token) {
      let user_token = result.token;
      
      if (msg.type && msg.type == 'API_AJAX_POST') {
        msg.payload.session_id = user_token;
        fetch(msg.url, {
          method: 'post',
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
            Authorization: 'Bearer ' + user_token,
          },
          body: JSON.stringify(msg.payload),
        })
          .then(function (response) {
           
            if (response.status !== 200) {
              console.log('Looks like there was a problem. Status Code: ' + response.status);
              return;
            }
            response.json().then(function (data) {
              sendResponse(data);
            });
          })
          .catch(function (err) {
            console.log('Fetch Error :-S', err);
          });
      }
    }

  });
  return true;
});
