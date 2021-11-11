// document selected variables
const $grid = document.getElementById('cards');
const $chaosButton = document.getElementById("add-meme");
const $modal = document.getElementById("open-modal");
const $modalClose = document.querySelector(".modal-close");
const $preview = document.getElementById("preview");
const $imageInput = document.getElementById("image-url");
const $submitForm = document.querySelector("#submit-meme");
const $plusButtons = document.querySelectorAll(".secondary");
const $form = document.meme_submission_form;

// initial fetch to render images from server on site
fetch("https://api.imgflip.com/get_memes", {
    method: 'GET'
  })
  .then(response => response.json())
  .then(result => {
    let memeArray = result
    const $trending = document.getElementById("trending");
    for (let i = 0; i < 3; i++) {
      let trendingImage = document.createElement('img')
      trendingImage.src = memeArray.data.memes[randomIntFromInterval(0, 99)].url;
      trendingImage.className = "random-gen-meme";
      $trending.appendChild(trendingImage);
    }
  })
  .catch(error => console.log('error', error));

fetch("http://localhost:3000/memes", {
    method: 'GET'
  })
  .then(response => response.json())
  .then(result => {
    result.forEach(meme => appendMeme(meme))
  })
  .then(() => {
    const $plusButtons = document.querySelectorAll(".secondary");
    $plusButtons.forEach(button => {
      button.addEventListener("click", increaseTracker)
    })
  })
  .catch(error => console.log('error', error));

// function calls
function appendMeme(meme) {
  let tags = meme.tags.length ? ("#" + meme.tags.join(" #")) : ""

  let card = document.createElement('div');
  card.className = 'column card';
  card.id = 'meme-' + meme.id;

  card.innerHTML =
    '<img src="' + meme.image + '" alt="' + meme.title + '">' +
    '<div class="overlay">' +
    '<div class="card-text">' +
    '<h2>' + meme.title + '</h2>' +
    '<p class="card-tags">' + tags + '</p>' +
    '<p class="card-source">source: ' + meme.source + '</p>' +
    '<p class="copy-tracker">copied <span id=tracker-' + meme.id + ' >' + meme.tracker + ' times</span> <button class="secondary text-center" data-id="' + meme.id + '" + data-url="' + meme.image + '">+</button></p>' +
    '</div>' +
    '</div>'

  $grid.prepend(card);
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function openModal() {
  $modal.classList.add("show")
}

function closeModal(clearForm) {
  event.preventDefault()
  $modal.classList.remove("show")
  if (clearForm) {
    $form.reset()
  }
}

function renderImage() {
  $preview.innerHTML = '<img src="' + $imageInput.value + '" alt="preview">'
}

function memeSubmit(data) {
  fetch("http://localhost:3000/memes", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(closeModal(true))
    .catch(error => console.log('error', error));
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

  if ($form.tags_text.value) {
    let tags = $form.tags_text.value.split(",")
    for (let i = 0; i < tags.length; i++) {
      let tag = tags[i];
      newMeme.tags.push(tag.trim())
    }
  }
  memeSubmit(newMeme)
  appendMeme(newMeme)
}


function increaseTracker() {
  let memeId = this.getAttribute("data-id")
  let memeUrl = this.getAttribute("data-url")
  let postUrl = "http://localhost:3000/memes/" + memeId

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
                    method: 'PATCH',
                    headers: {
                      "Content-Type": "application/json",
                      "Accept": "application/json"
                    },
                    body: JSON.stringify({
                      "tracker": numberOfUses
                    })
                  })
                  .then(response => console.log(response))
                  .then(() => {
                    let $tracker = document.getElementById("tracker-" + memeId)

                    let newText = numberOfUses == 1 ? numberOfUses + " time" : numberOfUses + " times"

                    $tracker.innerText = newText

                    alert("eureka! a delicious meme was copied to your clipboard. use it before the plebs get to it!!")

                  })
                  .catch(error => console.log('error', error))
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