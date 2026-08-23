import { loadPreferences } from "../../core/preferences.js";
import {
  alignPoints,
  boundingBoxCenter,
  rotatePoint,
  snapAngle,
} from "../../core/geometry.js";

export const viewControlsMixin = {
  setupViewControls() {
    this.rotationAngle = 0;
    this.rotationSnapshot = null;
    this.rotationPreview = false;
    this.rotationOriginalPoints = new Map();
    this.rotationBeforeSugarData = new Map();
    this.rotationBeforeConnections = new Map();
    this.setupRotationDial();
    this.setupTransformButtons();
    this.updateTransformAvailability();
  },

  setupRotationDial() {
    const dial = document.getElementById("rotationDial");
    const input = document.getElementById("rotationAngleInput");
    if (!dial || !input) return;

    const setRotation = (degrees) => {
      this.rotationAngle = Math.max(-180, Math.min(180, degrees));
      input.value = this.rotationAngle;
      dial.style.setProperty("--rotation-angle", `${this.rotationAngle}deg`);
    };

    const applyRotation = (degrees) => {
      this.rotateSelectedSugars(degrees);
    };

    dial.addEventListener("pointerdown", (event) => {
      const rect = dial.getBoundingClientRect();
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const move = (moveEvent) => {
        const radians = Math.atan2(moveEvent.clientY - center.y, moveEvent.clientX - center.x);
        setRotation(Math.round(radians * 180 / Math.PI));
        this.rotateSelectedSugars(this.rotationAngle);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        applyRotation(this.rotationAngle);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });

    input.addEventListener("change", () => {
      const degrees = Number(input.value) || 0;
      setRotation(degrees);
      applyRotation(degrees);
    });

    document.querySelectorAll("[data-rotation-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const degrees = Number(button.dataset.rotationStep) || 0;
        setRotation(degrees);
        applyRotation(degrees);
      });
    });
  },

  setupTransformButtons() {
    document.querySelectorAll("[data-align]").forEach((button) => {
      button.addEventListener("click", () => this.alignSelectedSugars(button.dataset.align));
    });
    document.getElementById("nudgeBranchesBtn")?.addEventListener("click", () => this.nudgeBranches());
    document.getElementById("normalizeLinkageLengthBtn")?.addEventListener("click", () => this.normalizeSelectedLinkageLengths());
  },

  updateTransformAvailability() {
    this.rotationAngle = 0;
    const rotationInput = document.getElementById("rotationAngleInput");
    if (rotationInput) rotationInput.value = "0";
    const rotationDial = document.getElementById("rotationDial");
    if (rotationDial) rotationDial.style.setProperty("--rotation-angle", "0deg");
    const hasSugars = this.getSelectedElementsByType("sugar").length > 0;
    const hasConnections = this.getEffectiveSelectedConnections().length > 0;
    document.querySelectorAll("[data-align], #nudgeBranchesBtn").forEach((button) => {
      button.disabled = !hasSugars;
    });
    const normalizeButton = document.getElementById("normalizeLinkageLengthBtn");
    if (normalizeButton) normalizeButton.disabled = !hasConnections;
    this.captureRotationSnapshot();
  },

  captureRotationSnapshot() {
    const selectedSugars = this.getSelectedElementsByType("sugar");
    if (selectedSugars.length === 0) {
      this.rotationSnapshot = null;
      return;
    }
    this.rotationSnapshot = selectedSugars.map((sugar) => ({
      id: sugar.getAttribute("id"),
      x: parseFloat(sugar.getAttribute("data-x")),
      y: parseFloat(sugar.getAttribute("data-y")),
    }));
    this.rotationPivot = boundingBoxCenter(this.rotationSnapshot);
  },

  rotateSelectedSugars(requestedAngle) {
    const preferences = loadPreferences();
    const angle = preferences.snapEnabled
      ? snapAngle(requestedAngle, preferences.snapRotationStep)
      : requestedAngle;
    const selectedSugars = this.getSelectedElementsByType("sugar");
    const selectedTexts = this.getSelectedElementsByType("text");
    const selectedElements = [...selectedSugars, ...selectedTexts];
    if (selectedElements.length === 0) return;

    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      if (!this.rotationPreview) {
        this.startStep("Rotate selection");
        this.rotationPreview = true;
        this.rotationBeforeSugarData = new Map([
          [element.getAttribute("id"), this.createObjectData(element)],
        ]);
        this.rotationBeforeConnections = this.snapshotConnections();
      }
      element.setAttribute("data-rotation", String(angle));
      if (this.getElementType(element) === "text") {
        this.applyTextRotation(element, angle);
      } else {
        this.applyShapeRotation(element, angle);
      }
      return;
    }

    if (!this.rotationPreview) {
      this.startStep("Rotate selection");
      this.rotationPreview = true;
      this.rotationOriginalPoints = new Map(
        selectedElements.map((element) => [
          element.getAttribute("id"),
          {
            x: parseFloat(element.getAttribute("data-x")),
            y: parseFloat(element.getAttribute("data-y")),
          },
        ]),
      );
      this.rotationBeforeSugarData = new Map(
        selectedElements.map((element) => [element.getAttribute("id"), this.createObjectData(element)]),
      );
      this.rotationBeforeConnections = this.snapshotConnections();
    }

    const originalPoints = Array.from(this.rotationOriginalPoints.values());
    const pivot = this.rotationPivot || boundingBoxCenter(originalPoints);

    selectedElements.forEach((element) => {
      const original = this.rotationOriginalPoints.get(element.getAttribute("id")) || {
        x: parseFloat(element.getAttribute("data-x")),
        y: parseFloat(element.getAttribute("data-y")),
      };
      const next = rotatePoint(original, pivot, angle);
      if (this.getElementType(element) === "text") {
        this.moveText(element, next.x, next.y);
      } else {
        this.moveSugar(element, next.x, next.y);
      }
    });
  },

  applyShapeRotation(sugar, angle) {
    const shape = sugar.querySelector(".sugar-shape");
    if (!shape) return;
    const x = parseFloat(sugar.getAttribute("data-x"));
    const y = parseFloat(sugar.getAttribute("data-y"));
    shape.setAttribute("transform", `rotate(${angle} ${x} ${y})`);
  },

  applyTextRotation(text, angle) {
    const x = parseFloat(text.getAttribute("data-x"));
    const y = parseFloat(text.getAttribute("data-y"));
    text.setAttribute("transform", `rotate(${angle} ${x} ${y})`);
  },

  commitRotationPreview() {
    if (!this.rotationPreview) return;
    const selectedElements = [
      ...this.getSelectedElementsByType("sugar"),
      ...this.getSelectedElementsByType("text"),
    ];
    selectedElements.forEach((element) => {
      const id = element.getAttribute("id");
      const beforeData = this.rotationBeforeSugarData.get(id);
      if (beforeData) {
        this.recordObjectModified(id, beforeData, this.createObjectData(element));
      }
    });
    this.commitConnections(this.rotationBeforeConnections);
    this.finishStep();
    this.rotationPreview = false;
    this.rotationOriginalPoints.clear();
    this.rotationBeforeSugarData.clear();
    this.rotationBeforeConnections.clear();
  },

  alignSelectedSugars(direction) {
    this.commitRotationPreview?.();
    const selectedSugars = this.getSelectedElementsByType("sugar");
    if (selectedSugars.length < 2) return;
    const points = selectedSugars.map((sugar) => ({
      x: parseFloat(sugar.getAttribute("data-x")),
      y: parseFloat(sugar.getAttribute("data-y")),
    }));
    const mapping = {
      left: { axis: "x", edge: "min" },
      right: { axis: "x", edge: "max" },
      "middle-horizontal": { axis: "y", edge: "center" },
      top: { axis: "y", edge: "min" },
      bottom: { axis: "y", edge: "max" },
      "middle-vertical": { axis: "x", edge: "center" },
    };
    const rule = mapping[direction];
    if (!rule) return;
    const aligned = alignPoints(points, rule.axis, rule.edge);
    this.applySelectedPositions(selectedSugars, aligned, "Align selection");
  },

  applySelectedPositions(sugars, points, label) {
    const beforeConnections = this.snapshotConnections();
    this.startStep(label);
    sugars.forEach((sugar, index) => {
      const beforeData = this.createObjectData(sugar);
      this.moveSugar(sugar, points[index].x, points[index].y);
      const afterData = this.createObjectData(sugar);
      this.recordObjectModified(sugar.getAttribute("id"), beforeData, afterData);
    });
    this.commitConnections(beforeConnections);
    this.finishStep();
  },

  snapshotConnections() {
    const before = new Map();
    this.getEffectiveSelectedConnections().forEach((connection) => {
      before.set(connection.getAttribute("id"), this.createObjectData(connection));
    });
    return before;
  },

  snapshotConnectionsForSugars(sugars) {
    const ids = new Set(sugars.map((sugar) => sugar.getAttribute("id")));
    const before = new Map();
    document.querySelectorAll(".connection").forEach((connection) => {
      if (ids.has(connection.getAttribute("data-start")) || ids.has(connection.getAttribute("data-end"))) {
        before.set(connection.getAttribute("id"), this.createObjectData(connection));
      }
    });
    return before;
  },

  commitConnections(before) {
    before.forEach((beforeData, id) => {
      const connection = document.getElementById(id);
      if (connection) {
        this.recordObjectModified(id, beforeData, this.createObjectData(connection));
      }
    });
  },

  commitConnectionMap(before) {
    this.commitConnections(before);
  },

  nudgeBranches() {
    this.commitRotationPreview?.();
    const mothers = this.getSelectedElementsByType("sugar");
    if (mothers.length === 0) return;

    const plans = [];
    const movedSugars = new Set();
    mothers.forEach((mother) => {
      const motherX = parseFloat(mother.getAttribute("data-x"));
      const motherY = parseFloat(mother.getAttribute("data-y"));
      const childEntries = [];
      document.querySelectorAll(".connection").forEach((connection) => {
        const startId = connection.getAttribute("data-start");
        const endId = connection.getAttribute("data-end");
        const start = document.getElementById(startId);
        const end = document.getElementById(endId);
        if (start === mother && end && end !== mother) childEntries.push({ child: end, connection });
        if (end === mother && start && start !== mother) childEntries.push({ child: start, connection });
      });

      if (childEntries.length < 2) return;
      const step = 360 / childEntries.length;
      childEntries.forEach(({ child }, index) => {
        const angle = step * index * Math.PI / 180;
        const oldX = parseFloat(child.getAttribute("data-x"));
        const oldY = parseFloat(child.getAttribute("data-y"));
        const childDx = oldX - motherX;
        const childDy = oldY - motherY;
        const distance = Math.sqrt(childDx * childDx + childDy * childDy);
        const next = {
          x: motherX + Math.cos(angle) * distance,
          y: motherY + Math.sin(angle) * distance,
        };
        const subtree = this.collectSugarSubtree(child, new Set([mother]));
        subtree.forEach((sugar) => movedSugars.add(sugar));
        plans.push({ child, next, oldX, oldY, subtree, excluded: new Set([mother]) });
      });
    });

    if (plans.length === 0) return;
    const movedSugarArray = Array.from(movedSugars);
    const beforeSugarData = new Map(
      movedSugarArray.map((sugar) => [sugar.getAttribute("id"), this.createObjectData(sugar)]),
    );
    const beforeConnections = this.snapshotConnectionsForSugars(movedSugarArray);
    this.startStep("Nudge branches");

    plans.forEach(({ child, next, oldX, oldY, subtree, excluded }) => {
        this.moveSugarSubtree(child, next.x - oldX, next.y - oldY, excluded);
      });

    movedSugarArray.forEach((sugar) => {
      const id = sugar.getAttribute("id");
      this.recordObjectModified(id, beforeSugarData.get(id), this.createObjectData(sugar));
    });
    this.commitConnectionMap(beforeConnections);
    this.finishStep();
  },

  collectSugarSubtree(root, excluded = new Set()) {
    const queue = [root];
    const result = [];
    const seen = new Set();
    while (queue.length > 0) {
      const sugar = queue.shift();
      if (seen.has(sugar) || excluded.has(sugar)) continue;
      seen.add(sugar);
      result.push(sugar);
      document.querySelectorAll(".connection").forEach((connection) => {
        const startId = connection.getAttribute("data-start");
        const endId = connection.getAttribute("data-end");
        if (startId === sugar.getAttribute("id")) {
          const child = document.getElementById(endId);
          if (child && child !== root) queue.push(child);
        } else if (endId === sugar.getAttribute("id")) {
          const child = document.getElementById(startId);
          if (child && child !== root) queue.push(child);
        }
      });
    }
    return result;
  },

  moveSugarSubtree(root, dx, dy, excluded = new Set()) {
    const queue = [root];
    const moved = new Set();
    while (queue.length > 0) {
      const sugar = queue.shift();
      if (moved.has(sugar) || excluded.has(sugar)) continue;
      moved.add(sugar);
      const x = parseFloat(sugar.getAttribute("data-x"));
      const y = parseFloat(sugar.getAttribute("data-y"));
      this.moveSugar(sugar, x + dx, y + dy);

      document.querySelectorAll(".connection").forEach((connection) => {
        const startId = connection.getAttribute("data-start");
        const endId = connection.getAttribute("data-end");
        if (startId === sugar.getAttribute("id")) {
          const child = document.getElementById(endId);
          if (child && child !== root) queue.push(child);
        } else if (endId === sugar.getAttribute("id")) {
          const child = document.getElementById(startId);
          if (child && child !== root) queue.push(child);
        }
      });
    }
  },
};
