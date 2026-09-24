(function () {
  "use strict";

  var STORAGE_KEY = "habits-tracker-v1";
  var DAYS_SHOWN = 7;

  var form = document.getElementById("habit-form");
  var nameInput = document.getElementById("habit-name");
  var list = document.getElementById("habits");
  var statTotal = document.getElementById("stat-total");
  var statToday = document.getElementById("stat-today");
  var statStreak = document.getElementById("stat-streak");

  function toISODate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function loadHabits() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveHabits(habits) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (err) {
      /* localStorage non disponibile: le modifiche non persistono in questa sessione */
    }
  }

  function makeId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "h-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  }

  function lastNDays(n) {
    var days = [];
    var today = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      days.push(d);
    }
    return days;
  }

  function computeStreak(log) {
    var streak = 0;
    var cursor = new Date();
    if (!log[toISODate(cursor)]) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (log[toISODate(cursor)]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  var weekdayFormatter = new Intl.DateTimeFormat("it-IT", { weekday: "short" });
  var fullDateFormatter = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function render() {
    var habits = loadHabits();
    var todayISO = toISODate(new Date());
    var days = lastNDays(DAYS_SHOWN);

    list.innerHTML = "";

    habits.forEach(function (habit) {
      var li = document.createElement("li");
      li.className = "habit-card";
      li.dataset.id = habit.id;

      var header = document.createElement("div");
      header.className = "habit-header";

      var title = document.createElement("h3");
      title.textContent = habit.name;
      header.appendChild(title);

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.setAttribute("aria-label", "Elimina abitudine " + habit.name);
      deleteBtn.textContent = "✕";
      deleteBtn.addEventListener("click", function () {
        if (window.confirm('Eliminare l\'abitudine "' + habit.name + '"?')) {
          removeHabit(habit.id);
        }
      });
      header.appendChild(deleteBtn);

      li.appendChild(header);

      var week = document.createElement("div");
      week.className = "habit-week";
      week.setAttribute("role", "group");
      week.setAttribute("aria-label", "Ultimi " + DAYS_SHOWN + " giorni per " + habit.name);

      days.forEach(function (day) {
        var iso = toISODate(day);
        var isDone = !!habit.log[iso];
        var isToday = iso === todayISO;

        var dayBtn = document.createElement("button");
        dayBtn.type = "button";
        dayBtn.className = "day-btn" + (isDone ? " is-done" : "") + (isToday ? " is-today" : "");
        dayBtn.setAttribute("aria-pressed", String(isDone));
        dayBtn.setAttribute(
          "aria-label",
          fullDateFormatter.format(day) + (isDone ? ", completata" : ", non completata")
        );
        dayBtn.textContent = weekdayFormatter.format(day).slice(0, 1).toUpperCase();
        dayBtn.addEventListener("click", function () {
          toggleDay(habit.id, iso);
        });

        week.appendChild(dayBtn);
      });

      li.appendChild(week);

      var streakEl = document.createElement("p");
      streakEl.className = "habit-streak";
      var streak = computeStreak(habit.log);
      streakEl.textContent =
        streak > 0
          ? "🔥 Streak: " + streak + (streak === 1 ? " giorno" : " giorni")
          : "Nessuna streak attiva: segna oggi per iniziare!";
      li.appendChild(streakEl);

      list.appendChild(li);
    });

    renderStats(habits, todayISO);
  }

  function renderStats(habits, todayISO) {
    var total = habits.length;
    statTotal.textContent = String(total);

    var doneToday = habits.filter(function (h) {
      return !!h.log[todayISO];
    }).length;
    var pct = total > 0 ? Math.round((doneToday / total) * 100) : 0;
    statToday.textContent = pct + "%";

    var bestStreak = habits.reduce(function (max, h) {
      return Math.max(max, computeStreak(h.log));
    }, 0);
    statStreak.textContent = String(bestStreak);
  }

  function addHabit(name) {
    var habits = loadHabits();
    habits.push({ id: makeId(), name: name, log: {} });
    saveHabits(habits);
    render();
  }

  function removeHabit(id) {
    var habits = loadHabits().filter(function (h) {
      return h.id !== id;
    });
    saveHabits(habits);
    render();
  }

  function toggleDay(id, iso) {
    var habits = loadHabits();
    var habit = habits.find(function (h) {
      return h.id === id;
    });
    if (!habit) {
      return;
    }
    if (habit.log[iso]) {
      delete habit.log[iso];
    } else {
      habit.log[iso] = true;
    }
    saveHabits(habits);
    render();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = nameInput.value.trim();
    if (!name) {
      return;
    }
    addHabit(name);
    nameInput.value = "";
    nameInput.focus();
  });

  render();
})();
