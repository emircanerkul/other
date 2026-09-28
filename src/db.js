/**
 * IndexedDB Storage Layer
 * Replaces deprecated WebSQL with modern IndexedDB API
 */

const DB_NAME = 'sheetjs';
const DB_VERSION = 3;
const STORE_NAME = 'projects';

let db = null;

/**
 * Initialize IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function(event) {
      const database = event.target.result;
      // Reset the store on upgrade so stale schemas never survive
      if (database.objectStoreNames.contains(STORE_NAME)) {
        database.deleteObjectStore(STORE_NAME);
      }
      const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('sheet', 'sheet', { unique: false });
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function() {
      reject(new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Store sheet rows in IndexedDB
 * Rows are kept generically with their original column keys,
 * so any spreadsheet structure works without a hardcoded mapping.
 * @param {string} sheetName
 * @param {Array<Object>} rows
 */
export async function storeSheet(sheetName, rows) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    rows.forEach(function(row, index) {
      store.put({
        id: sheetName + '-' + index,
        sheet: sheetName,
        data: row
      });
    });

    transaction.oncomplete = function() {
      resolve();
    };
    transaction.onerror = function() {
      reject(new Error('Failed to store sheet data'));
    };
  });
}

/**
 * Get all rows for a sheet (with original column keys)
 * @param {string} sheetName
 * @returns {Promise<Array<Object>>}
 */
export async function getSheetData(sheetName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sheet');
    const request = index.getAll(sheetName);

    request.onsuccess = function() {
      resolve(request.result.map(function(record) {
        return record.data;
      }));
    };

    request.onerror = function() {
      reject(new Error('Failed to get data'));
    };
  });
}

/**
 * Get count of rows for a sheet
 * @param {string} sheetName 
 * @returns {Promise<number>}
 */
export async function getSheetCount(sheetName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sheet');
    const request = index.count(sheetName);

    request.onsuccess = function() {
      resolve(request.result);
    };

    request.onerror = function() {
      reject(new Error('Failed to count data'));
    };
  });
}

/**
 * Get all sheet names that currently have stored data
 * @returns {Promise<string[]>}
 */
export async function getSheetNames() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sheet');
    // getAll() returns the records; read the indexed 'sheet' values from them.
    // (getAllKeys() would return primary keys like "Job List-0", NOT sheet names!)
    const request = index.getAll();

    request.onsuccess = function() {
      const names = [];
      const seen = {};
      for (let i = 0; i < request.result.length; i++) {
        const name = request.result[i].sheet;
        if (name && !seen[name]) {
          seen[name] = true;
          names.push(name);
        }
      }
      resolve(names);
    };

    request.onerror = function() {
      reject(new Error('Failed to get sheet names'));
    };
  });
}

/**
 * Clear all data
 */
export async function clearAllData() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = function() {
      resolve();
    };
    request.onerror = function() {
      reject(new Error('Failed to clear data'));
    };
  });
}
