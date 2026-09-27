const MOODS = {
  exhausted: "Понятно 😄 Кажется, вам срочно требуется маленькая порция хорошего настроения.",
  annoyed: "Очень устали — это понятно. Давайте добавим чуть-чуть хорошего настроения, без лишних усилий.",
  quiet: "Тишина — отличный запрос. Начнём с одной спокойной карточки.",
  okay: "Нормально — уже хорошая основа. Добавим сверху капельку хорошего настроения.",
  good: "Как здорово. Тогда закрепим это настроение ещё одной приятной карточкой."
};

const MOOD_FACES = {
  1: "😫",
  2: "😕",
  3: "🙂",
  4: "😊",
  5: "😄"
};

function shuffle(items) {
  const list = items.slice();
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = list[index];
    list[index] = list[swapIndex];
    list[swapIndex] = current;
  }
  return list;
}

function moodLevelFromCards(cardsDrawn) {
  if (cardsDrawn >= 3) return 5;
  return 1 + cardsDrawn;
}

function createGame(cards) {
  const game = {
    cardsDrawn: 0,
    lastCardId: null,
    deck: [],
    draw() {
      if (this.deck.length === 0) {
        let pool = cards.filter((card) => card.id !== this.lastCardId);
        if (pool.length === 0) pool = cards.slice();
        this.deck = shuffle(pool);
      }
      const card = this.deck.pop();
      this.lastCardId = card.id;
      this.cardsDrawn += 1;
      return card;
    },
    reset() {
      this.cardsDrawn = 0;
      this.lastCardId = null;
      this.deck = [];
    }
  };
  return game;
}

function initGame() {
  const game = createGame(CARDS);
  const startScreen = document.getElementById("screen-start");
  const playScreen = document.getElementById("screen-play");
  const meter = document.getElementById("meter");
  const meterFace = document.getElementById("meter-face");
  const meterBars = document.getElementById("meter-bars");
  const reaction = document.getElementById("reaction");
  const reactionText = document.getElementById("reaction-text");
  const liftButton = document.getElementById("lift-mood");
  const cardEmoji = document.getElementById("card-emoji");
  const cardKicker = document.getElementById("card-kicker");
  const cardTitle = document.getElementById("card-title");
  const cardText = document.getElementById("card-text");
  const cardPanel = document.getElementById("card");
  const playActions = document.getElementById("play-actions");
  const againButton = document.getElementById("want-more");
  const restartLate = document.getElementById("restart-late");
  const finale = document.getElementById("finale");
  const meterSlotStart = document.getElementById("meter-slot-start");
  const meterSlotPlay = document.getElementById("meter-slot-play");
  const moreButton = document.getElementById("one-more");
  const restartButtons = document.querySelectorAll("[data-action='restart']");
  const moodButtons = document.querySelectorAll(".mood-option");
  const confettiRoot = document.getElementById("confetti");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let selectedMood = null;
  let drawing = false;

  function showScreen(name) {
    startScreen.hidden = name !== "start";
    playScreen.hidden = name !== "play";
  }

  function updateMeter() {
    const level = moodLevelFromCards(game.cardsDrawn);
    meter.hidden = false;
    meterFace.textContent = MOOD_FACES[level];
    meterBars.setAttribute("aria-label", "Уровень настроения: " + level + " из 5");
    const bars = meterBars.querySelectorAll("span");
    bars.forEach((bar, index) => {
      bar.classList.toggle("is-on", index < level);
    });
  }

  function renderCard(card) {
    cardEmoji.textContent = card.emoji;
    cardKicker.textContent = card.kicker;
    cardTitle.textContent = card.title;
    cardTitle.hidden = card.title === "";
    cardText.replaceChildren();
    card.paragraphs.forEach((paragraph) => {
      const line = document.createElement("p");
      line.textContent = paragraph;
      cardText.appendChild(line);
    });
    cardPanel.classList.remove("is-in");
    void cardPanel.offsetWidth;
    cardPanel.classList.add("is-in");
  }

  function burstConfetti() {
    if (reduceMotion) return;
    const colors = ["#7ec8f0", "#3db7c9", "#ffffff", "#9ad7ff", "#5aa6e6", "#d8f6f2"];
    for (let index = 0; index < 36; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[index % colors.length];
      piece.style.animationDelay = Math.random() * 0.15 + "s";
      piece.style.animationDuration = 1.8 + Math.random() * 1.1 + "s";
      confettiRoot.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function showDrawnCard() {
    if (drawing) return;
    drawing = true;
    window.setTimeout(() => {
      drawing = false;
    }, 350);

    const card = game.draw();
    const isFinale = game.cardsDrawn === 3;
    meterSlotPlay.appendChild(meter);
    renderCard(card);
    updateMeter();
    finale.hidden = !isFinale;
    playActions.hidden = isFinale;
    restartLate.hidden = game.cardsDrawn < 4;
    showScreen("play");
    const behavior = reduceMotion ? "auto" : "smooth";
    if (isFinale) {
      burstConfetti();
      finale.scrollIntoView({ behavior, block: "end" });
    } else {
      cardPanel.scrollIntoView({ behavior, block: "start" });
    }
  }

  moodButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedMood = button.dataset.mood;
      moodButtons.forEach((item) => {
        item.classList.toggle("is-selected", item === button);
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      reactionText.textContent = MOODS[selectedMood];
      reaction.hidden = false;
      liftButton.hidden = false;
      updateMeter();
      if (!reduceMotion) {
        liftButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  liftButton.addEventListener("click", showDrawnCard);
  againButton.addEventListener("click", showDrawnCard);
  moreButton.addEventListener("click", showDrawnCard);

  restartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      game.reset();
      selectedMood = null;
      moodButtons.forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });
      reaction.hidden = true;
      liftButton.hidden = true;
      finale.hidden = true;
      playActions.hidden = false;
      restartLate.hidden = true;
      meter.hidden = true;
      meterSlotStart.appendChild(meter);
      drawing = false;
      showScreen("start");
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
}

document.addEventListener("DOMContentLoaded", initGame);
