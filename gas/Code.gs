/**
 * IndoPaket Tracker — Google Apps Script Web App API
 * 
 * Deploy sebagai Web App:
 *   - Execute as: Me
 *   - Who has access: Anyone
 * 
 * Endpoints:
 *   GET  ?action=ping                        → health check
 *   GET  ?action=getAll&since=ISO_TIMESTAMP   → all data (optionally since timestamp)
 *   GET  ?action=getStores&since=...          → stores only
 *   GET  ?action=getPackages&since=...        → packages only
 *   GET  ?action=getTrips&since=...           → trips only
 *   GET  ?action=getDevices                   → registered devices
 *   POST {action:'batchUpdate', device_id, data:{stores,packages,trips}}
 *   POST {action:'fullSync', device_id, data:{stores,packages,trips}}
 *   POST {action:'registerDevice', device_id, device_name, role}
 */

// ============================================================
// GET Handler
// ============================================================
function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(10000);
  } catch (err) {
    return _jsonResponse({ error: 'Server busy, try again', code: 429 });
  }

  try {
    var action = e.parameter.action || '';
    var since = e.parameter.since || null;
    var result;

    switch (action) {
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString(), version: 1 };
        break;
      case 'getAll':
        result = _getAllData(since);
        break;
      case 'getStores':
        result = _getSheetData('stores', since);
        break;
      case 'getPackages':
        result = _getSheetData('packages', since);
        break;
      case 'getTrips':
        result = _getSheetData('trips', since);
        break;
      case 'getDevices':
        result = _getSheetData('devices', null);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return _jsonResponse(result);
  } catch (err) {
    return _jsonResponse({ error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// POST Handler
// ============================================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.tryLock(30000);
  } catch (err) {
    return _jsonResponse({ error: 'Server busy, try again', code: 429 });
  }

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || '';
    var result;

    switch (action) {
      case 'batchUpdate':
        result = _batchUpdate(payload.device_id || 'unknown', payload.data || {});
        break;
      case 'fullSync':
        result = _fullSync(payload.device_id || 'unknown', payload.data || {});
        break;
      case 'registerDevice':
        result = _registerDevice(payload);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }

    return _jsonResponse(result);
  } catch (err) {
    return _jsonResponse({ error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ============================================================
// onEdit Trigger — auto-update timestamps when wife edits directly
// ============================================================
function onEdit(e) {
  try {
    var sheet = e.source.getActiveSheet();
    var tabName = sheet.getName();
    var dataTabs = ['stores', 'packages', 'trips'];

    if (dataTabs.indexOf(tabName) === -1) return;

    var row = e.range.getRow();
    if (row <= 1) return; // Skip header row

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var updatedAtCol = headers.indexOf('updated_at') + 1;
    var modifiedByCol = headers.indexOf('_last_modified_by') + 1;

    if (updatedAtCol > 0) {
      sheet.getRange(row, updatedAtCol).setValue(new Date().toISOString());
    }
    if (modifiedByCol > 0) {
      sheet.getRange(row, modifiedByCol).setValue('sheets_direct');
    }
  } catch (err) {
    // Silently fail — onEdit should not throw errors
    Logger.log('onEdit error: ' + err.message);
  }
}

// ============================================================
// Core Data Functions
// ============================================================

/**
 * Get all data from all sheets, optionally filtered by 'since' timestamp
 */
function _getAllData(since) {
  return {
    stores: _getSheetData('stores', since),
    packages: _getSheetData('packages', since),
    trips: _getSheetData('trips', since),
    devices: _getSheetData('devices', null),
    serverTime: new Date().toISOString()
  };
}

/**
 * Read data from a single sheet tab, optionally filtered by updated_at > since
 */
function _getSheetData(tabName, since) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);

  if (!sheet) {
    return { error: 'Sheet not found: ' + tabName, data: [] };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { data: [] }; // Only header row or empty
  }

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return { data: [] };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var updatedAtIndex = headers.indexOf('updated_at');

  var results = [];
  for (var i = 0; i < dataRange.length; i++) {
    var row = dataRange[i];

    // Skip empty rows (no ID)
    if (!row[0] || row[0] === '') continue;

    // Filter by 'since' timestamp if provided
    if (since && updatedAtIndex >= 0) {
      var rowUpdated = row[updatedAtIndex];
      if (rowUpdated && new Date(rowUpdated) <= new Date(since)) {
        continue;
      }
    }

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j] && headers[j] !== '') {
        obj[headers[j]] = row[j];
      }
    }
    results.push(obj);
  }

  return { data: results };
}

/**
 * Batch update: merge incoming data with existing sheet data
 * - If record exists (same ID): update row if incoming is newer
 * - If record is new: append row
 */
function _batchUpdate(deviceId, data) {
  var counts = { updated: 0, created: 0, skipped: 0 };
  var tabNames = ['stores', 'packages', 'trips'];

  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var items = data[tabName];
    if (!items || !Array.isArray(items) || items.length === 0) continue;

    var result = _upsertRows(tabName, items, deviceId);
    counts.updated += result.updated;
    counts.created += result.created;
    counts.skipped += result.skipped;
  }

  // Update device last_seen
  _updateDeviceLastSeen(deviceId);

  // Update sync_meta
  _updateSyncMeta(deviceId);

  return {
    success: true,
    counts: counts,
    serverTime: new Date().toISOString()
  };
}

/**
 * Full sync: overwrite all sheet data with incoming data
 * WARNING: This replaces all existing data!
 */
function _fullSync(deviceId, data) {
  var counts = { stores: 0, packages: 0, trips: 0 };
  var tabNames = ['stores', 'packages', 'trips'];

  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var items = data[tabName];
    if (!items || !Array.isArray(items)) continue;

    _overwriteSheet(tabName, items);
    counts[tabName] = items.length;
  }

  _updateDeviceLastSeen(deviceId);
  _updateSyncMeta(deviceId);

  return {
    success: true,
    counts: counts,
    serverTime: new Date().toISOString()
  };
}

/**
 * Register a new device or update existing
 */
function _registerDevice(payload) {
  var deviceId = payload.device_id || '';
  var deviceName = payload.device_name || 'Unknown Device';
  var role = payload.role || 'viewer';

  if (!deviceId) {
    return { error: 'device_id is required' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('devices');
  if (!sheet) {
    sheet = ss.insertSheet('devices');
    sheet.getRange(1, 1, 1, 4).setValues([['device_id', 'device_name', 'role', 'last_seen']]);
  }

  var lastRow = sheet.getLastRow();
  var existingRow = -1;

  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === deviceId) {
        existingRow = i + 2; // +2 for header and 0-index
        break;
      }
    }
  }

  var now = new Date().toISOString();

  if (existingRow > 0) {
    // Update existing device
    sheet.getRange(existingRow, 2, 1, 3).setValues([[deviceName, role, now]]);
  } else {
    // Add new device
    sheet.appendRow([deviceId, deviceName, role, now]);
  }

  return {
    success: true,
    device_id: deviceId,
    message: existingRow > 0 ? 'Device updated' : 'Device registered'
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Upsert rows into a sheet: update existing (by ID) or append new
 */
function _upsertRows(tabName, items, deviceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  var counts = { updated: 0, created: 0, skipped: 0 };

  if (!sheet) {
    return counts;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Build ID → row mapping for existing data
  var idIndex = headers.indexOf('id');
  var updatedAtIndex = headers.indexOf('updated_at');
  var modifiedByIndex = headers.indexOf('_last_modified_by');

  var existingIds = {};
  if (lastRow > 1) {
    var existingData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < existingData.length; i++) {
      if (existingData[i][idIndex]) {
        existingIds[existingData[i][idIndex]] = {
          row: i + 2,
          data: existingData[i],
          updated_at: existingData[i][updatedAtIndex] || ''
        };
      }
    }
  }

  var rowsToAppend = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!item.id) continue;

    var existing = existingIds[item.id];

    if (existing) {
      // Record exists — check if incoming is newer
      var incomingTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
      var existingTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;

      if (incomingTime > existingTime) {
        // Incoming is newer — update the row
        var rowData = _itemToRow(item, headers, deviceId);
        sheet.getRange(existing.row, 1, 1, headers.length).setValues([rowData]);
        counts.updated++;
      } else {
        counts.skipped++;
      }
    } else {
      // New record — queue for append
      var rowData = _itemToRow(item, headers, deviceId);
      rowsToAppend.push(rowData);
      counts.created++;
    }
  }

  // Batch append new rows
  if (rowsToAppend.length > 0) {
    sheet.getRange(lastRow + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }

  return counts;
}

/**
 * Convert a JS object to a row array matching sheet headers
 */
function _itemToRow(item, headers, deviceId) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (header === '_last_modified_by') {
      row.push(deviceId || item[header] || '');
    } else if (item.hasOwnProperty(header)) {
      var val = item[header];
      // Convert booleans and arrays to string for Sheets compatibility
      if (typeof val === 'boolean') {
        row.push(val ? 'true' : 'false');
      } else if (Array.isArray(val)) {
        row.push(JSON.stringify(val));
      } else {
        row.push(val !== null && val !== undefined ? val : '');
      }
    } else {
      row.push('');
    }
  }
  return row;
}

/**
 * Overwrite an entire sheet with new data (keeps headers)
 */
function _overwriteSheet(tabName, items) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return;

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Clear existing data (keep headers)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }

  if (items.length === 0) return;

  // Write new data
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    rows.push(_itemToRow(items[i], headers, ''));
  }

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Update device last_seen timestamp
 */
function _updateDeviceLastSeen(deviceId) {
  if (!deviceId || deviceId === 'unknown') return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('devices');
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === deviceId) {
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var lastSeenCol = headers.indexOf('last_seen') + 1;
      if (lastSeenCol > 0) {
        sheet.getRange(i + 2, lastSeenCol).setValue(new Date().toISOString());
      }
      break;
    }
  }
}

/**
 * Update sync_meta sheet with last sync timestamp per device
 */
function _updateSyncMeta(deviceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sync_meta');
  if (!sheet) {
    sheet = ss.insertSheet('sync_meta');
    sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  }

  var metaKey = 'last_sync_' + deviceId;
  var lastRow = sheet.getLastRow();
  var found = false;

  if (lastRow > 1) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i][0] === metaKey) {
        sheet.getRange(i + 2, 2).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
  }

  if (!found) {
    sheet.appendRow([metaKey, new Date().toISOString()]);
  }
}

/**
 * Create JSON response
 */
function _jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
