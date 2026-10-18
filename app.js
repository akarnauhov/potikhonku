/**
 * Потихоньку — из прокрастинации к первому шагу.
 * Опора: самосострадание, маркировка аффекта, MCII (желание→итог→препятствие→если-то),
 * правило 2 минут / крошечный старт, короткий таймбокс.
 */

const state = {
  feel: "нейтрально",
  wish: "",
  outcome: "",
  obstacle: "",
  ifThen: "",
  tiny: "",
  minutes: 2,
  remaining: 120,
  paused: false,
  timerId: null,
};

const feelLines = {
  тревога: "Тревога часто толкает «уйти в другое». Мы начнём с крошечного куска — так безопаснее.",
  усталость: "При усталости большой план ломается. Достаточно двух минут — и можно остановиться.",
  скука: "Скука любит яркие отвлечения. Сделаем старт коротким и конкретным.",
  страх: "Страх идеального результата — частая причина откладывания. Нам нужен только старт, не шедевр.",
  перегруз: "Когда всего слишком много, помогает одно ближайшее действие — и всё.",
  нейтрально: "Это нормально. Мы не будем себя ругать — так проще сдвинуться.",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function show(step) {
  $$(".panel").forEach((p) => {
    p.hidden = p.dataset.step !== step;
  });
  if (step === "tiny") {
    $("#wishEcho").textContent = state.wish;
    if (!state.tiny) {
      $("#tinyInput").value = suggestTiny(state.wish);
      state.tiny = $("#tinyInput").value.trim();
    }
  }
  if (step === "focus") renderFocus();
}

function suggestTiny(wish) {
  const w = wish.trim();
  if (!w) return "Открыть нужное окно и сделать первое движение";
  if (w.length < 50) return `Только начать: ${w}`;
  return `Первые 2 минуты: ${w.slice(0, 70)}…`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${pad(s)}`;
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderFocus() {
  $("#focusTask").textContent = state.tiny || state.wish;
  const plan = state.ifThen
    ? `Если ${state.obstacle || "отвлечение"} — то ${state.ifThen}`
    : state.outcome
      ? `Зачем: ${state.outcome}`
      : "Только этот шаг. Остальное подождёт.";
  $("#planLine").textContent = plan;
  $("#timer").textContent = formatTime(state.remaining);
  $("#pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза";
}

function startTimer() {
  stopTimer();
  state.paused = false;
  state.remaining = state.minutes * 60;
  renderFocus();
  state.timerId = setInterval(() => {
    if (state.paused) return;
    state.remaining -= 1;
    $("#timer").textContent = formatTime(Math.max(0, state.remaining));
    if (state.remaining <= 0) {
      stopTimer();
      finishSession(true);
    }
  }, 1000);
}

function finishSession(fromTimer) {
  stopTimer();
  $("#doneTitle").textContent = fromTimer
    ? "Время вышло. Старт уже сделан."
    : "Ты начал(а). Это главное.";
  $("#doneText").textContent = state.outcome
    ? `Даже короткий кусок приближает: «${state.outcome}». Можно остановиться без вины — или взять ещё 2 минуты.`
    : "Даже короткий старт снижает сопротивление. Можно остановиться — или сделать ещё один крошечный кусок.";
  show("done");
  try {
    localStorage.setItem(
      "potikhonku_last",
      JSON.stringify({
        wish: state.wish,
        tiny: state.tiny,
        at: Date.now(),
      })
    );
  } catch {
    /* ignore */
  }
}

function loadLast() {
  try {
    const raw = localStorage.getItem("potikhonku_last");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.wish && Date.now() - data.at < 1000 * 60 * 60 * 24 * 3) {
      $("#wishInput").placeholder = `В прошлый раз: ${data.wish}`;
    }
  } catch {
    /* ignore */
  }
}

// navigation
$$("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = btn.getAttribute("data-go");
    if (step === "start") stopTimer();
    show(step);
  });
});

$$('input[name="feel"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.feel = input.value;
    $("#feelNote").textContent = feelLines[state.feel] || feelLines.нейтрально;
  });
});

$("#wishNext").addEventListener("click", () => {
  state.wish = $("#wishInput").value.trim();
  state.outcome = $("#outcomeInput").value.trim();
  if (!state.wish) {
    $("#wishInput").focus();
    return;
  }
  show("plan");
});

$("#planNext").addEventListener("click", () => {
  state.obstacle = $("#obstacleInput").value.trim();
  state.ifThen = $("#ifThenInput").value.trim();
  if (!state.obstacle) state.obstacle = "захочу отвлечься";
  if (!state.ifThen) state.ifThen = "вернусь к крошечному шагу на экране";
  $("#ifThenInput").value = state.ifThen;
  $("#obstacleInput").value = state.obstacle;
  state.tiny = "";
  $("#tinyInput").value = "";
  show("tiny");
});

$$(".dur").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".dur").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.minutes = Number(btn.dataset.min);
  });
});

$("#startFocus").addEventListener("click", () => {
  state.tiny = $("#tinyInput").value.trim() || suggestTiny(state.wish);
  $("#tinyInput").value = state.tiny;
  show("focus");
  startTimer();
});

$("#pauseBtn").addEventListener("click", () => {
  state.paused = !state.paused;
  $("#pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза";
});

$("#skipTimer").addEventListener("click", () => finishSession(false));

$("#stopHere").addEventListener("click", () => show("rest"));

$("#another").addEventListener("click", () => {
  state.minutes = 2;
  $$(".dur").forEach((b) => b.classList.toggle("active", b.dataset.min === "2"));
  show("focus");
  startTimer();
});

loadLast();
show("start");
