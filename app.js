/**
 * Потихоньку v2 — ветки под причину, клики вместо текста, лёгкая геймификация.
 */

const STORAGE = "potikhonku_v2";

const FEELS = [
  {
    id: "тревога",
    title: "Тревожно",
    blurb: "Маршрут «безопасный старт» · короткие раунды",
    color: "#2f6b57",
  },
  {
    id: "усталость",
    title: "Устал(а)",
    blurb: "Маршрут «минимум энергии» · только 2 минуты",
    color: "#5a6f8a",
  },
  {
    id: "скука",
    title: "Скучно",
    blurb: "Маршрут «челлендж» · очки и комбо",
    color: "#8a4b2e",
  },
  {
    id: "страх",
    title: "Страшно начать",
    blurb: "Маршрут «плохо, но сделано» · против идеала",
    color: "#a54b3c",
  },
  {
    id: "перегруз",
    title: "Слишком много",
    blurb: "Маршрут «выбери одно» · остальное подождёт",
    color: "#6b5b8a",
  },
  {
    id: "нейтрально",
    title: "Просто откладываю",
    blurb: "Маршрут «если — то» · классика",
    color: "#2f6b57",
  },
];

const TASKS = {
  тревога: ["Открыть нужный файл", "Написать одно предложение", "Ответить на одно короткое сообщение", "Составить список из 3 пунктов"],
  усталость: ["Открыть задачу и прочитать заголовок", "Сделать один клик / одно сохранение", "Убрать одну мелочь со стола", "Закрыть лишние вкладки"],
  скука: ["Гонка: 2 минуты только на дело", "Сделать самый скучный кусок первым", "Таймер против ленты", "Мини-квест: 1 результат"],
  страх: ["Написать уродливый черновик", "Сделать заведомо неидеальную версию", "Отправить «пока черновик»", "Начать с самой страшной строки"],
  перегруз: ["Выбрать одну задачу из кучи", "Закрыть всё, кроме одного окна", "Назвать следующий физический шаг", "Вычеркнуть одно лишнее"],
  нейтрально: ["Открыть документ", "Сделать первый абзац", "Закрыть один тикет / пункт", "Подготовить одну цифру / факт"],
};

const WHYS = {
  тревога: ["Чтобы тревога стала меньше", "Чтобы не крутилось вечером", "Чтобы почувствовать контроль"],
  усталость: ["Чтобы не тащить на завтра", "Чтобы честно отдохнуть потом", "Чтобы тело не злилось на «ничего»"],
  скука: ["Чтобы победить скуку очками", "Чтобы было что засчитать", "Ради комбо-серии"],
  страх: ["Чтобы страх уменьшился после старта", "Чтобы идеал не блокировал", "Чтобы появился хоть какой-то артефакт"],
  перегруз: ["Чтобы гора стала одним камнем", "Чтобы мозг перестал жужжать", "Чтобы остальное подождало законно"],
  нейтрально: ["Чтобы сдвиг случился сегодня", "Чтобы вечером было спокойнее", "Просто начать"],
};

const BLOCKS = {
  тревога: ["Открою чаты", "Начну всё перепроверять", "Уйду «подготовиться ещё»"],
  усталость: ["Лягу в телефон", "Скажу «потом»", "Открою что полегче"],
  скука: ["Открою ленту", "Переключусь на видео", "Найду «более интересное»"],
  страх: ["Буду править до идеала", "Начну с нуля ещё раз", "Отложу, пока не готов(а)"],
  перегруз: ["Открою ещё одну задачу", "Начну всё сразу", "Буду прыгать между пунктами"],
  нейтрально: ["Открою отвлечение", "Сделаю «ещё пять минут» ничего", "Передумаю"],
};

const IFS = {
  тревога: "то возвращаюсь к шагу на экране и дышу 1 раз",
  усталость: "то делаю только этот крошечный шаг и останавливаюсь",
  скука: "то не открываю ленту, пока таймер жив — ради очков",
  страх: "то оставляю плохое как есть и жму «сделал»",
  перегруз: "то игнорирую остальное до конца раунда",
  нейтрально: "то возвращаюсь к шагу на экране",
};

const MODES = {
  тревога: { tag: "безопасный старт", minutes: [2, 5], default: 2, xp: 12, body: "mode-anxiety" },
  усталость: { tag: "минимум энергии", minutes: [2], default: 2, xp: 14, body: "mode-tired" },
  скука: { tag: "челлендж", minutes: [2, 5, 10], default: 5, xp: 18, body: "mode-boredom" },
  страх: { tag: "плохо, но сделано", minutes: [2, 5], default: 2, xp: 16, body: "mode-fear" },
  перегруз: { tag: "только одно", minutes: [2, 5], default: 2, xp: 13, body: "mode-overload" },
  нейтрально: { tag: "если — то", minutes: [2, 5, 10, 25], default: 5, xp: 11, body: "" },
};

const state = {
  feel: null,
  pathIndex: 0,
  path: [],
  picks: {},
  minutes: 2,
  remaining: 120,
  paused: false,
  timerId: null,
  combo: 0,
};

let save = loadSave();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function loadSave() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE)) || {
        xp: 0,
        streak: 0,
        lastDay: "",
        starts: 0,
        badges: [],
      }
    );
  } catch {
    return { xp: 0, streak: 0, lastDay: "", starts: 0, badges: [] };
  }
}

function persist() {
  localStorage.setItem(STORAGE, JSON.stringify(save));
  renderHud();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function levelFromXp(xp) {
  return Math.floor(xp / 40) + 1;
}

function renderHud() {
  $("#hudXp").textContent = String(save.xp);
  $("#hudStreak").textContent = String(save.streak);
  $("#hudLevel").textContent = `ур. ${levelFromXp(save.xp)}`;
}

function show(step) {
  $$(".panel").forEach((p) => {
    p.hidden = p.dataset.step !== step;
  });
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(sec) {
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function buildFeelGrid() {
  const grid = $("#feelGrid");
  grid.innerHTML = "";
  FEELS.forEach((f) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "feel-card";
    btn.style.borderLeftColor = f.color;
    btn.innerHTML = `<strong>${f.title}</strong><span>${f.blurb}</span>`;
    btn.addEventListener("click", () => startPath(f.id));
    grid.appendChild(btn);
  });
}

function buildPath(feel) {
  const tasks = TASKS[feel];
  const whys = WHYS[feel];
  const blocks = BLOCKS[feel];
  const mode = MODES[feel];
  const path = [];

  path.push({
    key: "task",
    title: titles.task[feel],
    lead: leads.task[feel],
    options: tasks,
  });

  if (feel !== "усталость") {
    path.push({
      key: "why",
      title: "Зачем этот старт?",
      lead: "Одно касание — без сочинений.",
      options: whys,
    });
  }

  path.push({
    key: "block",
    title: titles.block[feel],
    lead: leads.block[feel],
    options: blocks,
  });

  if (mode.minutes.length > 1) {
    path.push({
      key: "time",
      title: "Сколько держим фокус?",
      lead: feel === "скука" ? "Длиннее раунд — больше очков." : "Короче часто лучше.",
      options: mode.minutes.map((m) => `${m} мин`),
    });
  }

  path.push({
    key: "ready",
    title: titles.ready[feel],
    lead: `План: если отвлечение — ${IFS[feel]}`,
    options: ["Погнали"],
    soft: softs[feel],
  });

  return path;
}

const titles = {
  task: {
    тревога: "Какой самый безопасный кусок?",
    усталость: "Что почти не требует сил?",
    скука: "Какой челлендж берёшь?",
    страх: "Что сделаем нарочно плохо?",
    перегруз: "Что одно оставляем?",
    нейтрально: "Что начнёшь?",
  },
  block: {
    тревога: "Что обычно срывает?",
    усталость: "Куда утянет усталость?",
    скука: "Главный враг скуки?",
    страх: "Как идеал обычно побеждает?",
    перегруз: "Как обычно раздуваешь список?",
    нейтрально: "Что чаще всего мешает?",
  },
  ready: {
    тревога: "Готов(а) к мягкому старту?",
    усталость: "Две минуты — и свободен(на)",
    скука: "Готов(а) к раунду?",
    страх: "Готов(а) сделать плохо — но сделать?",
    перегруз: "Одно. Только одно.",
    нейтрально: "Всё собрано. Стартуем?",
  },
};

const leads = {
  task: {
    тревога: "Не «вся работа», а ход, который не пугает.",
    усталость: "Если тяжело — бери самый крошечный.",
    скука: "Выбери миссию. Очки ждут.",
    страх: "Идеал запрещён на этот раунд.",
    перегруз: "Остальное официально не существует 2–5 минут.",
    нейтрально: "Тапни вариант — и идём дальше.",
  },
  block: {
    тревога: "Сразу повесим «если — то».",
    усталость: "Заранее простим себя за желание сдаться.",
    скука: "Это босс-файт раунда.",
    страх: "Назовём ловушку идеала.",
    перегруз: "Запретим расползание внимания.",
    нейтрально: "Классика: препятствие → ответ.",
  },
};

const softs = {
  тревога: "Ты не обязан(а) сделать хорошо. Достаточно начать.",
  усталость: "После таймера можно сразу лечь / отдохнуть — это часть плана.",
  скука: "Если доживёшь таймер без ленты — комбо растёт.",
  страх: "«Плохо» здесь = успех. Полировка потом.",
  перегруз: "Всё, что не выбрано — не твоя вина сейчас.",
  нейтрально: "Маленький старт бьёт большой план, который не начат.",
};

function startPath(feelId) {
  state.feel = feelId;
  state.path = buildPath(feelId);
  state.pathIndex = 0;
  state.picks = {};
  state.combo = save.streak > 0 ? Math.min(3, save.streak) : 1;
  const mode = MODES[feelId];
  state.minutes = mode.default;
  document.body.className = mode.body || "";
  renderPathStep();
  show("path");
}

function renderPathStep() {
  const step = state.path[state.pathIndex];
  const total = state.path.length;
  $("#pathFill").style.width = `${((state.pathIndex + 1) / total) * 100}%`;
  $("#pathStep").textContent = `маршрут «${state.feel}» · ${state.pathIndex + 1}/${total}`;
  $("#pathTitle").textContent = step.title;
  $("#pathLead").textContent = step.lead;

  const soft = $("#pathSoft");
  if (step.soft) {
    soft.hidden = false;
    soft.textContent = step.soft;
  } else {
    soft.hidden = true;
  }

  const box = $("#pathChoices");
  box.innerHTML = "";
  const selected = state.picks[step.key];

  step.options.forEach((opt) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (selected === opt ? " active" : "");
    b.textContent = opt;
    b.addEventListener("click", () => {
      state.picks[step.key] = opt;
      if (step.key === "time") state.minutes = parseInt(opt, 10);
      renderPathStep();
    });
    box.appendChild(b);
  });

  $("#pathNext").disabled = !state.picks[step.key];
  $("#pathBack").textContent = state.pathIndex === 0 ? "К причинам" : "Назад";
}

function goFocus() {
  const mode = MODES[state.feel];
  const task = state.picks.task;
  const why = state.picks.why;
  const block = state.picks.block;
  const xpBase = mode.xp + Math.max(0, state.minutes - 2) * 2;

  $("#modeTag").textContent = mode.tag;
  $("#focusTask").textContent = task;
  $("#planLine").textContent = `Если «${block}» — ${IFS[state.feel]}${why ? ` · ${why}` : ""}`;
  $("#xpPreview").textContent = String(Math.round(xpBase * (1 + (state.combo - 1) * 0.15)));

  if (state.feel === "скука" && state.combo > 1) {
    $("#combo").hidden = false;
    $("#comboN").textContent = String(state.combo);
  } else {
    $("#combo").hidden = true;
  }

  show("focus");
  startTimer();
}

function startTimer() {
  stopTimer();
  state.paused = false;
  state.remaining = state.minutes * 60;
  $("#timer").textContent = formatTime(state.remaining);
  $("#pauseBtn").textContent = "Пауза";
  state.timerId = setInterval(() => {
    if (state.paused) return;
    state.remaining -= 1;
    $("#timer").textContent = formatTime(Math.max(0, state.remaining));
    if (state.remaining <= 0) {
      stopTimer();
      finish(true);
    }
  }, 1000);
}

function finish(fullTimer) {
  stopTimer();
  const mode = MODES[state.feel];
  let gained = mode.xp + Math.max(0, state.minutes - 2) * 2;
  if (fullTimer) gained += 4;
  if (state.feel === "скука") gained = Math.round(gained * (1 + (state.combo - 1) * 0.2));
  if (!fullTimer) gained = Math.max(6, Math.round(gained * 0.7));

  const day = today();
  if (save.lastDay !== day) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    save.streak = save.lastDay === y ? save.streak + 1 : 1;
    save.lastDay = day;
  }
  save.xp += gained;
  save.starts += 1;

  const badge = maybeBadge();
  persist();

  $("#loot").textContent = `+${gained} ✦`;
  $("#doneTitle").textContent = fullTimer ? "Раунд закрыт" : "Старт засчитан";
  $("#doneText").textContent =
    state.feel === "усталость"
      ? "Можно честно отдыхать. Ты уже сдвинул(а) иглу."
      : state.feel === "страх"
        ? "Плохое, но существующее — лучше идеального нигде."
        : state.feel === "скука"
          ? "Скука проиграла раунд. Комбо можно продолжить."
          : "Сопротивление чуть слабее. Можно стоп — или ещё круг.";

  const badgeEl = $("#badge");
  if (badge) {
    badgeEl.hidden = false;
    badgeEl.textContent = `Значок: ${badge}`;
  } else {
    badgeEl.hidden = true;
  }

  if (state.feel === "скука" && fullTimer) state.combo += 1;
  show("done");
}

function maybeBadge() {
  const map = [
    [1, "Первый сдвиг"],
    [3, "Три старта"],
    [5, "Серия жива"],
    [10, "Десять начинаний"],
  ];
  for (const [n, name] of map) {
    if (save.starts === n && !save.badges.includes(name)) {
      save.badges.push(name);
      return name;
    }
  }
  if (save.streak === 3 && !save.badges.includes("3 дня подряд")) {
    save.badges.push("3 дня подряд");
    return "3 дня подряд";
  }
  return null;
}

$("#pathNext").addEventListener("click", () => {
  if (!state.picks[state.path[state.pathIndex].key]) return;
  if (state.pathIndex >= state.path.length - 1) {
    goFocus();
    return;
  }
  state.pathIndex += 1;
  renderPathStep();
});

$("#pathBack").addEventListener("click", () => {
  if (state.pathIndex === 0) {
    document.body.className = "";
    show("start");
    return;
  }
  state.pathIndex -= 1;
  renderPathStep();
});

$("#pauseBtn").addEventListener("click", () => {
  state.paused = !state.paused;
  $("#pauseBtn").textContent = state.paused ? "Продолжить" : "Пауза";
});

$("#skipTimer").addEventListener("click", () => finish(false));
$("#another").addEventListener("click", () => {
  if (state.feel === "усталость") state.minutes = 2;
  goFocus();
});
$("#stopHere").addEventListener("click", () => {
  $("#restText").textContent =
    save.streak > 1
      ? `Серия: ${save.streak} дн. Огонь на месте. Можно идти.`
      : "Остановиться без вины — тоже навык. Серия начата.";
  show("rest");
});
$("#toStart").addEventListener("click", () => {
  document.body.className = "";
  show("start");
});
$("#restHome").addEventListener("click", () => {
  document.body.className = "";
  show("start");
});

buildFeelGrid();
renderHud();
show("start");
