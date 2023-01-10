const formSubmit = document.getElementById("loginForm");
const setUsername = document.querySelector('[name="username"]');
const setUserName = document.querySelector(".userName");

const logoutBtn = document.querySelector(".logout");
const counterBtn = document.querySelector(".addCounter");
const login = document.querySelector(".login");
const loggedIn = document.querySelector(".logged-in");

const errUsername = document.querySelector(".invalid-feedback.username");
const errPass = document.querySelector(".invalid-feedback.key");

// const fetchApi = async function (url, method, token) {
//   const res = await fetch(url, {
//     method: method,
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//       "Content-type": "application/json; charset=UTF-8",
//       Authorization: "Bearer " + token,
//     },
//   });
//   const data = await res.json();
//   return data;
// };

const loginApi = async function (url, form) {
  const searchParams = new URLSearchParams(form);
  const res = await fetch(url, {
    mode: "cors",
    method: "post",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",// "application/x-www-form-urlencoded",
    },
    body:  JSON.stringify(form),//searchParams.toString(),
  });
  const data = await res.json();
  return data;
};

// Get data in storage
chrome.storage.local.get(function (result) {
  if (result.username) {
    setUsername.value = result.username;
  }
  if (result.token) {
    login.classList.add("d-none");
    loggedIn.classList.add("d-block");
    setUserName.innerHTML += result.username;
  } else {
    return;
  }
});
setUsername.addEventListener("change", function () {
  chrome.storage.local.set({ username: this.value }, function () { });
});

// Form Login
formSubmit.addEventListener("submit", function (e) {
  e.preventDefault();

  const url = "https://topclass.3tc.vn/index.php?route=api/login";
  const formData = new FormData(e.target);
  const data = {};
  formData.forEach((value, key) => (data[key] = value));
  data.secret_key = 'Mg@ENtGB$vHGWk4D9KgQ';

  loginApi(url, data)
    .then(function (data) {
      // Login isvalid
      const errorList = data.error;
      if (errorList) {
        if (errorList["username"]) {
          errUsername.innerHTML += errorList["username"][0];
          errUsername.classList.add("d-block");

          errUsername.addEventListener("focus", function () {
            errUsername.classList.remove("d-block");
          });
        }
        if (errorList["key"]) {
          errPass.innerHTML += errorList["key"][0];
          errPass.classList.add("d-block");

          errPass.addEventListener("focus", function () {
            errUsername.classList.remove("d-block");
          });
        }
      }

      // Login success
      if (data.success != "") {
        chrome.storage.local.set(
          { token: data.api_token },
          function () {
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
              var activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, { type: 'RELOAD_MAIN_PAGE' });
            });
            window.location.reload();
          }
        );
      }
    })
    .catch(function (err) {
      console.log("Fetch Error :-S", err);
    });
});

// Form Logout
logoutBtn.addEventListener("click", function (e) {
  e.preventDefault();
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { type: 'RELOAD_MAIN_PAGE' });
  });
  chrome.storage.local.set({ username: {}, token: null }, function () { });
  window.location.reload();
});
