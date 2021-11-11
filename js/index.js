// document selected variables
const $grid = document.getElementById("cards");
const $chaosButton = document.getElementById("add-meme");
const $modal = document.getElementById("open-modal");
const $modalClose = document.querySelector(".modal-close");
const $preview = document.getElementById("preview");
const $imageInput = document.getElementById("image-url");
const $submitForm = document.querySelector("#submit-meme");
const $plusButtons = document.querySelectorAll(".secondary");
const $form = document.meme_submission_form;

// initial fetch to render images from api and server on site
fetch("https://api.imgflip.com/get_memes", {
    method: "GET"
  })
  .then(response => response.json())
  .then(result => {
    let memeArray = result
    const $trending = document.getElementById("trending");
    // renders 3 random memes on the right sidebar of the webpage, utilizes randomly generated id's
    for (let i = 0; i < 3; i++) {
      let trendingImage = document.createElement("img")
      trendingImage.src = memeArray.data.memes[randomIntFromInterval(0, 99)].url;
      trendingImage.className = "random-gen-meme";
      $trending.appendChild(trendingImage);
    }
  })
  .catch(error => console.log("error", error));

fetch("http://localhost:3000/memes", {
    method: 'GET'
  })
  .then(response => response.json())
  .then(result => {
    result.forEach(meme => appendMeme(meme))
  })
  .catch(error => console.log("error", error));

// function calls
function appendMeme(meme) {
  let tags = meme.tags.length ? ("#" + meme.tags.join(" #")) : ""

  let card = document.createElement("div");
  card.className = "column card";
  card.id = "meme-" + meme.id;


  let button = document.createElement('button');
  button.className = 'secondary text-center';
  button.setAttribute("data-id", meme.id);
  button.setAttribute("data-url", meme.image);
  button.innerText = "+";
  button.onclick = increaseTracker;

  card.innerHTML =
    '<img src="' + meme.image + '" alt="' + meme.title + '">' +
    '<div class="overlay">' +
    '<div class="card-text">' +
    '<h2>' + meme.title + '</h2>' +
    '<p class="card-tags">' + tags + '</p>' +
    '<p class="card-source">source: ' + meme.source + '</p>' +
    '<p class="copy-tracker" id="tracking-wrap-' + meme.id + '">' +
    'copied <span id=tracker-' + meme.id + ' >' + meme.tracker + ' times</span> ' +
    '</p>' +
    '</div>' +
    '</div>'

  $grid.prepend(card);
  document.getElementById("tracking-wrap-" + meme.id).append(button)

}

// generates a randome integer to pull a random meme from API
function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function openModal() {
  $modal.classList.add("show")
}

// closes submit modal, resets form, removes image preview; on click, prevents default
function closeModal(clearForm) {
  if (event) {
    event.preventDefault()
  }
  $modal.classList.remove("show")
  if (clearForm) {
    $form.reset()
    $preview.innerHTML = "";
  }
}

// confirms that url passed is an image
function checkIfImageExists(url, callback) {
  const img = new Image();
  img.src = url;

  if (img.complete) {
    callback(true);
  } else {
    img.onload = () => {
      callback(true);
    };

    img.onerror = () => {
      callback(false);
    };
  }
}

// renders image preview is valid, console log's if not valid and does not preview 
function renderImage() {

  let imgValid = false
  if (!$imageInput.validity.typeMismatch) {
    let entryImage = $imageInput.value;
    checkIfImageExists(entryImage, (exists) => {
      if (exists) {
        $preview.innerHTML = '<img src="' + entryImage + '" alt="preview">'
        imgValid = true;
      } else {
        console.error("Image does not exists.")
      }
    })
  }
  if (!imgValid) {
    $preview.innerHTML = ""
  }
}

function memeSubmit(data) {
  fetch("http://localhost:3000/memes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(response => {
      closeModal(true)
      appendMeme(response)
    })
    .catch(error => console.log("error", error));
}

function postNewMeme(e) {
  e.preventDefault();

  const newMeme = {
    "title": $form.title_text.value,
    "image": $form.image_url.value,
    "tags": [],
    "source": $form.source_text.value,
    "tracker": 0
  };

  // ensures tags are passed submitted to server in an array without additional characters
  if ($form.tags_text.value) {
    let tags = $form.tags_text.value.split(",")
    for (let i = 0; i < tags.length; i++) {
      let tag = tags[i];
      newMeme.tags.push(tag.trim())
    }
  }
  memeSubmit(newMeme)
}


function increaseTracker() {
  let memeId = this.getAttribute("data-id")
  let memeUrl = this.getAttribute("data-url")
  let postUrl = "http://localhost:3000/memes/" + memeId

  // copy url to clipboard
  navigator.permissions.query({
      name: "clipboard-write"
    })
    .then(result => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.writeText(memeUrl)
          .then(function () {
            fetch(postUrl)
              .then(response => response.json())
              .then(meme => {
                let numberOfUses = meme.tracker + 1

                fetch(postUrl, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      "Accept": "application/json"
                    },
                    body: JSON.stringify({
                      "tracker": numberOfUses
                    })
                  })
                  .then(() => {
                    let $tracker = document.getElementById("tracker-" + memeId)

                    let newText = numberOfUses == 1 ? numberOfUses + " time" : numberOfUses + " times"

                    $tracker.innerText = newText

                    alert("eureka! a delicious meme was copied to your clipboard. use it before the plebs get to it!!")

                  })
                  .catch(error => console.log("error", error))
              })
          }, function () {
            alert("unable to copy image! so sad.")
          });
      }
    });
}

// page event listeners
$chaosButton.addEventListener("click", openModal);
$modalClose.addEventListener("click", closeModal);
$imageInput.addEventListener("blur", renderImage);
$form.addEventListener("submit", postNewMeme);