/**
 * IndexedDB Storage Layer
 * Replaces deprecated WebSQL with modern IndexedDB API
 */

const DB_NAME = 'sheetjs';
const DB_VERSION = 2;
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
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('sheet', 'sheet', { unique: false });
      }
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
 * Store sheet data in IndexedDB
 * @param {string} sheetName 
 * @param {Array} headers 
 * @param {Array} rows 
 */
export async function storeSheet(sheetName, headers, rows) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing data for this sheet
    const clearRequest = store.clear();
    clearRequest.onsuccess = function() {
      // Insert all rows
      rows.forEach(function(row, index) {
        const data = {
          id: sheetName + '-' + index,
          sheet: sheetName,
          headers: headers,
          projectNo: row['No.'],
          jobType: row['Job type'],
          engineerName: row['Engineer Name'],
          jobCreationDate: row['Job Creation Date'],
          projectStartDate: row['Project Start date'],
          endProjectDate: row['End Project Date'],
          jobCompleted: row['Job completed'],
          remarks: row['Remarks'],
          totalContractValue: row['Total contract value']
        };
        store.add(data);
      });
      resolve();
    };
    clearRequest.onerror = function() {
      reject(new Error('Failed to clear store'));
    };
  });
}

/**
 * Get all data for a sheet
 * @param {string} sheetName 
 * @returns {Promise<Array>}
 */
export async function getSheetData(sheetName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sheet');
    const request = index.getAll(sheetName);

    request.onsuccess = function() {
      const results = request.result.map(function(item) {
        return {
          'No.': item.projectNo,
          'Job type': item.jobType,
          'Engineer Name': item.engineerName,
          'Job Creation Date': item.jobCreationDate,
          'Project Start date': item.projectStartDate,
          'End Project Date': item.endProjectDate,
          'Job completed': item.jobCompleted,
          'Remarks': item.remarks,
          'Total contract value': item.totalContractValue
        };
      });
      resolve(results);
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
 * Get all sheet names
 * @returns {Promise<string[]>}
 */
export async function getSheetNames() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('sheet');
    const request = index.getAllKeys();

    request.onsuccess = function() {
      const names = [];
      const seen = {};
      for (let i = 0; i < request.result.length; i++) {
        const name = request.result[i];
        if (!seen[name]) {
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
