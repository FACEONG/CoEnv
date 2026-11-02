// CoEnv project page: task explorer, figure zoom, hero video playback, BibTeX copy.
(function () {
  // ---------- figure zoom ----------
  var zoom = document.getElementById("zoom");
  var zoomImg = zoom && zoom.querySelector("img");
  function openZoom(img) {
    if (!zoom || typeof zoom.showModal !== "function") return;
    zoomImg.src = img.currentSrc || img.src;
    zoomImg.alt = img.alt;
    zoom.showModal();
  }
  document.querySelectorAll(".wide img").forEach(function (img) {
    img.addEventListener("click", function () { openZoom(img); });
  });
  if (zoom) zoom.addEventListener("click", function () { zoom.close(); });

  // ---------- task explorer (Figure 3) ----------
  // Milestones and counts: paper Table 1 and Appendix B (10 real trials per task).
  var TWO = "Two Franka Research 3 arms";
  var THREE = "Franka Research 3 + AgileX Piper dual-arm (three arms)";
  var TASKS = {
    cube: {
      name: "Cube Stacking", setup: TWO,
      desc: "Two arms stack a blue cube and a red cube separately.",
      ms: ["Both cubes are grasped and lifted.", "The cubes are stably stacked."],
      ours: [10, 9], base: [7, 6], twin: true,
      failure: "The top cube slips off because of a position offset between the twin and the real cell at placement."
    },
    ball: {
      name: "Ball Pickup", setup: TWO,
      desc: "Two arms lift a soccer ball together while keeping balanced contact.",
      ms: ["Both arms reach the ball with contact poses.", "The ball is lifted off the surface."],
      ours: [6, 6], base: [9, 4], twin: true,
      failure: null,
      chartNote: "All four CoEx failures on this task happened at the initial bimanual contact. Every trial that made contact completed the lift."
    },
    cylinder: {
      name: "Transfer Cylinder", setup: TWO,
      desc: "One arm picks up a cylinder and hands it to the other arm, which places it at the target location.",
      ms: ["The first arm grasps and lifts the cylinder.", "The second arm receives the cylinder.", "The cylinder is placed at the target location."],
      ours: [8, 6, 6], base: [9, 4, 4], twin: false,
      failure: "The receiving gripper does not line up with the handing gripper, and the cylinder drops during the handover."
    },
    cucumber: {
      name: "Place Cucumber", setup: THREE,
      desc: "Lift the pot lid and put the cucumbers into the pot.",
      ms: ["The pot lid is opened and held stably.", "Two cucumbers are picked up.", "Both cucumbers are placed inside the pot."],
      ours: [8, 8, 6], base: [9, 7, 4], twin: true,
      failure: "The lid is grasped at an unstable point (red circle) and falls while it is being held."
    },
    brush: {
      name: "Brush Box", setup: THREE,
      desc: "Grasp a brush and repeatedly sweep the box.",
      ms: ["The brush is grasped.", "The box is grasped.", "The brush contacts the box in a sweeping motion."],
      ours: [8, 8, 8], base: [10, 9, 7], twin: true,
      failure: "A planning error drops the brush (red rectangle) while it is being moved."
    }
  };

  var ex = document.getElementById("tasks");
  if (ex) {
    var tabs = Array.prototype.slice.call(ex.querySelectorAll('[role="tab"]'));
    var viewBtns = Array.prototype.slice.call(ex.querySelectorAll(".ex-views button"));
    var main = ex.querySelector(".ex-main");
    var tag = ex.querySelector(".ex-tag");
    var strip = ex.querySelector(".ex-strip");
    var note = ex.querySelector(".ex-note");
    var nameEl = ex.querySelector(".ex-name");
    var setupEl = ex.querySelector(".ex-setup");
    var descEl = ex.querySelector(".ex-desc");
    var chart = ex.querySelector(".ex-chart");
    var state = { task: "cube", view: "run", frame: 0 };

    function framesFor(id, view) {
      var t = TASKS[id];
      if (view === "run") {
        return [1, 2, 3, 4, 5].map(function (k) {
          return { src: "images/tasks/" + id + "_" + k + ".webp", thumb: "images/tasks/" + id + "_" + k + "_s.webp",
                   label: String(k), alt: t.name + ", keyframe " + k + " of 5" };
        });
      }
      if (view === "twin" && t.twin) {
        return [
          { src: "images/tasks/" + id + "_twin.webp", thumb: "images/tasks/" + id + "_twin.webp", label: "Twin", alt: t.name + ", planned rollout in the digital twin" },
          { src: "images/tasks/" + id + "_real.webp", thumb: "images/tasks/" + id + "_real.webp", label: "Real", alt: t.name + ", real execution" }
        ];
      }
      if (view === "failure" && t.failure) {
        return [{ src: "images/tasks/" + id + "_failure.webp", thumb: "images/tasks/" + id + "_failure.webp", label: "Fail", alt: t.name + ", failure case" }];
      }
      return [];
    }

    function available(id, view) {
      if (view === "run") return true;
      if (view === "twin") return TASKS[id].twin;
      return !!TASKS[id].failure;
    }

    function setMain(f) {
      if (!f) return;
      var pre = new Image();
      pre.src = f.src;
      var swap = function () { main.src = f.src; main.alt = f.alt; };
      if (pre.decode) pre.decode().then(swap, swap); else swap();
    }

    function renderNote() {
      var t = TASKS[state.task];
      if (state.view === "run") note.textContent = "Keyframe " + (state.frame + 1) + " of 5 from a successful real-world run.";
      else if (state.view === "twin") note.textContent = state.frame === 0
        ? "Planned rollout in the digital twin. Select Real to see the same step on the robot."
        : "The same step executed on the real robot.";
      else note.textContent = t.failure;
    }

    function renderStage() {
      var frames = framesFor(state.task, state.view);
      strip.innerHTML = "";
      frames.forEach(function (f, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", f.alt);
        if (i === state.frame) b.setAttribute("aria-current", "true");
        b.innerHTML = '<img src="' + f.thumb + '" alt="" loading="lazy"><span class="n">' + f.label + "</span>";
        b.addEventListener("click", function () { selectFrame(i); });
        b.addEventListener("mouseenter", function () { if (matchMedia("(hover: hover)").matches) selectFrame(i); });
        strip.appendChild(b);
      });
      setMain(frames[state.frame]);
      tag.hidden = state.view === "run";
      tag.textContent = state.view === "twin" ? (state.frame === 0 ? "Twin" : "Real") : state.view === "failure" ? "Failure" : "";
      renderNote();
    }

    function selectFrame(i) {
      if (i === state.frame) return;
      state.frame = i;
      var frames = framesFor(state.task, state.view);
      Array.prototype.forEach.call(strip.children, function (b, k) {
        if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      setMain(frames[i]);
      if (state.view === "twin") tag.textContent = i === 0 ? "Twin" : "Real";
      renderNote();
    }

    function renderInfo() {
      var t = TASKS[state.task];
      nameEl.textContent = t.name;
      setupEl.textContent = t.setup;
      descEl.textContent = t.desc;
      var rows = t.ms.map(function (text, i) {
        var last = i === t.ms.length - 1;
        return '<div class="ex-row"><div class="ex-ms"><b>S' + (i + 1) + "</b>" + text +
          (last ? ' <em class="nw">(task success)</em>' : "") + "</div>" +
          '<div class="bar ours"><div class="track"><i data-w="' + t.ours[i] * 10 + '"></i></div><span>' + t.ours[i] + "/10</span></div>" +
          '<div class="bar base"><div class="track"><i data-w="' + t.base[i] * 10 + '"></i></div><span>' + t.base[i] + "/10</span></div></div>";
      });
      if (t.chartNote) rows.push('<p class="ex-chart-note">' + t.chartNote + "</p>");
      chart.innerHTML = rows.join("");
      // let the bars grow from zero on each task switch
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          chart.querySelectorAll("i[data-w]").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
        });
      });
    }

    function renderViews() {
      viewBtns.forEach(function (b) {
        var v = b.getAttribute("data-view");
        var ok = available(state.task, v);
        b.disabled = !ok;
        b.title = ok ? "" : "Not available for this task";
        b.setAttribute("aria-pressed", v === state.view ? "true" : "false");
      });
    }

    function selectTask(id, focus) {
      state.task = id;
      if (!available(id, state.view)) state.view = "run";
      state.frame = 0;
      tabs.forEach(function (b) {
        var on = b.getAttribute("data-task") === id;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      renderViews();
      renderInfo();
      renderStage();
    }

    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { selectTask(b.getAttribute("data-task")); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = tabs[(i + d + tabs.length) % tabs.length];
        selectTask(n.getAttribute("data-task"), true);
      });
      // warm the cache for the first keyframe of a task before it is clicked
      b.addEventListener("mouseenter", function () {
        var img = new Image();
        img.src = "images/tasks/" + b.getAttribute("data-task") + "_1.webp";
      });
    });

    viewBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        state.view = b.getAttribute("data-view");
        state.frame = 0;
        renderViews();
        renderStage();
      });
    });

    main.addEventListener("click", function () { openZoom(main); });

    ex.addEventListener("keydown", function (e) {
      if (e.target.getAttribute("role") === "tab") return;
      var frames = framesFor(state.task, state.view);
      if (e.key === "ArrowRight" && state.frame < frames.length - 1) { selectFrame(state.frame + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft" && state.frame > 0) { selectFrame(state.frame - 1); e.preventDefault(); }
    });

    selectTask("cube");
  }

  // ---------- hero video ----------
  // Plays only while on screen; click toggles; no autoplay for reduced motion.
  var video = document.getElementById("demo");
  if (video) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var userPaused = false;
    if (reduce) {
      video.removeAttribute("autoplay");
      video.pause();
      video.controls = true;
    } else {
      video.addEventListener("click", function () {
        if (video.paused) { userPaused = false; video.play(); }
        else { userPaused = true; video.pause(); }
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !userPaused) {
              var p = video.play();
              if (p && p.catch) p.catch(function () {});
            } else if (!e.isIntersecting) {
              video.pause();
            }
          });
        }, { threshold: 0.25 }).observe(video);
      }
    }
  }

  // ---------- copy BibTeX ----------
  document.querySelectorAll(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pre = document.getElementById(btn.getAttribute("data-target"));
      if (!pre) return;
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(done, function () {});
      } else {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        try { document.execCommand("copy"); done(); } catch (err) {}
        sel.removeAllRanges();
      }
    });
  });
})();
