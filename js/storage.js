(function () {
  function getStoredArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`Error reading array from localStorage key "${key}":`, error);
      return [];
    }
  }

  function getStoredObject(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      console.error(`Error reading object from localStorage key "${key}":`, error);
      return {};
    }
  }

  function setStoredValue(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }

  function removeStoredValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }

  function getArsenalStorage() {
    return getStoredArray("arsenal");
  }

  function saveArsenalStorage(data) {
    setStoredValue("arsenal", data);
  }

  function getCustomBallsStorage() {
    return getStoredArray("customBalls");
  }

  function saveCustomBallsStorage(data) {
    setStoredValue("customBalls", data);
  }

  function getBallNotesStorage() {
    return getStoredObject("ballNotes");
  }

  function saveBallNotesStorage(data) {
    setStoredValue("ballNotes", data);
  }

  function getSessionLogsStorage() {
    return getStoredArray("sessionLogs");
  }

  function saveSessionLogsStorage(data) {
    setStoredValue("sessionLogs", data);
  }

  window.getStoredArray = getStoredArray;
  window.getStoredObject = getStoredObject;
  window.setStoredValue = setStoredValue;
  window.removeStoredValue = removeStoredValue;

  window.getArsenalStorage = getArsenalStorage;
  window.saveArsenalStorage = saveArsenalStorage;
  window.getCustomBallsStorage = getCustomBallsStorage;
  window.saveCustomBallsStorage = saveCustomBallsStorage;
  window.getBallNotesStorage = getBallNotesStorage;
  window.saveBallNotesStorage = saveBallNotesStorage;
  window.getSessionLogsStorage = getSessionLogsStorage;
  window.saveSessionLogsStorage = saveSessionLogsStorage;
})();