const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const _ = require('lodash');

const adapter = new FileSync(path.join(__dirname, 'maternal_health.json'));
const db = low(adapter);

// Initialize DB with default empty collections
db.defaults({
  users: [],
  health_profiles: [],
  meal_logs: [],
  medications: [],
  medication_logs: [],
  activities: [],
  health_trends: [],
  conversations: [],
  _counters: {
    users: 0,
    health_profiles: 0,
    meal_logs: 0,
    medications: 0,
    medication_logs: 0,
    activities: 0,
    health_trends: 0,
    conversations: 0
  }
}).write();

// Helper to get next auto-increment ID
function nextId(collection) {
  const current = db.get(`_counters.${collection}`).value() || 0;
  const next = current + 1;
  db.set(`_counters.${collection}`, next).write();
  return next;
}

// Simple prepared statement emulator
function prepare(sql) {
  return {
    _sql: sql,
    
    run(...args) {
      const params = args.flat();
      return executeSql(sql, params, 'run');
    },
    
    get(...args) {
      const params = args.flat();
      return executeSql(sql, params, 'get');
    },
    
    all(...args) {
      const params = args.flat();
      return executeSql(sql, params, 'all');
    }
  };
}

function executeSql(sql, params, mode) {
  const sqlTrimmed = sql.trim();
  const sqlUpper = sqlTrimmed.toUpperCase();
  
  // INSERT INTO users (name, email, password, auth_provider, provider_id) VALUES (?,?,?,?,?)
  if (sqlUpper.startsWith('INSERT INTO')) {
    const tableMatch = sqlTrimmed.match(/INSERT INTO (\w+)/i);
    if (!tableMatch) return { lastInsertRowid: null, changes: 0 };
    const table = tableMatch[1];
    
    const colMatch = sqlTrimmed.match(/\(([^)]+)\)\s+VALUES/i);
    if (!colMatch) return { lastInsertRowid: null, changes: 0 };
    const cols = colMatch[1].split(',').map(c => c.trim());
    
    const id = nextId(table);
    const record = { id };
    cols.forEach((col, i) => {
      record[col] = params[i] !== undefined ? params[i] : null;
    });
    record.created_at = record.created_at || new Date().toISOString();
    
    db.get(table).push(record).write();
    return { lastInsertRowid: id, changes: 1 };
  }
  
  // UPDATE
  if (sqlUpper.startsWith('UPDATE')) {
    const tableMatch = sqlTrimmed.match(/UPDATE (\w+) SET/i);
    if (!tableMatch) return { changes: 0 };
    const table = tableMatch[1];
    
    const setMatch = sqlTrimmed.match(/SET (.+?) WHERE/is);
    const whereMatch = sqlTrimmed.match(/WHERE (.+)$/is);
    if (!setMatch || !whereMatch) return { changes: 0 };
    
    const setParts = setMatch[1].split(',').map(s => s.trim());
    const wherePart = whereMatch[1].trim();
    
    const setParamCount = setParts.length;
    const setParams = params.slice(0, setParamCount);
    const whereParams = params.slice(setParamCount);
    
    const updateData = {};
    setParts.forEach((part, i) => {
      const colMatch = part.match(/(\w+)\s*=/);
      if (colMatch) updateData[colMatch[1]] = setParams[i];
    });
    updateData.updated_at = new Date().toISOString();
    
    const filter = buildWhereFilter(wherePart, whereParams);
    let changed = 0;
    db.get(table).filter(filter).each(record => {
      Object.assign(record, updateData);
      changed++;
    }).write();
    
    return { changes: changed };
  }
  
  // SELECT
  if (sqlUpper.startsWith('SELECT')) {
    const tableMatch = sqlTrimmed.match(/FROM (\w+)/i);
    if (!tableMatch) return mode === 'all' ? [] : null;
    const table = tableMatch[1];
    
    // JOIN queries — simplified handling
    if (sqlUpper.includes('JOIN')) {
      return mode === 'all' ? [] : null;
    }
    
    const whereMatch = sqlTrimmed.match(/WHERE (.+?)(?:\s+ORDER BY|\s+LIMIT|\s+GROUP BY|$)/is);
    const orderMatch = sqlTrimmed.match(/ORDER BY (.+?)(?:\s+LIMIT|$)/is);
    const limitMatch = sqlTrimmed.match(/LIMIT (\d+)/i);
    const offsetMatch = sqlTrimmed.match(/OFFSET (\d+)/i);
    
    let records = db.get(table).value() || [];
    
    if (whereMatch) {
      const filter = buildWhereFilter(whereMatch[1].trim(), params);
      records = records.filter(filter);
    }
    
    if (orderMatch) {
      const orderPart = orderMatch[1].trim();
      const desc = orderPart.toUpperCase().includes('DESC');
      const col = orderPart.replace(/\s+ASC|\s+DESC/gi, '').trim().split(',')[0].trim();
      records = _.orderBy(records, [col], [desc ? 'desc' : 'asc']);
    }
    
    if (offsetMatch) records = records.slice(parseInt(offsetMatch[1]));
    if (limitMatch) records = records.slice(0, parseInt(limitMatch[1]));
    
    // COUNT aggregation
    if (sqlTrimmed.match(/SELECT\s+COUNT\(\*\)/i)) {
      const countMatch = sqlTrimmed.match(/COUNT\(\*\)\s+as\s+(\w+)/i);
      const key = countMatch ? countMatch[1] : 'count';
      const obj = { [key]: records.length };
      // Handle SUM
      const sumMatches = [...sqlTrimmed.matchAll(/SUM\(CASE WHEN (\w+)\s*=\s*'(\w+)' THEN 1 ELSE 0 END\)\s+as\s+(\w+)/gi)];
      sumMatches.forEach(m => {
        const [, col, val, alias] = m;
        obj[alias] = records.filter(r => r[col] === val).length;
      });
      return mode === 'all' ? [obj] : obj;
    }
    
    return mode === 'all' ? records : (records[0] || null);
  }
  
  return mode === 'all' ? [] : null;
}

function buildWhereFilter(whereStr, params) {
  const conditions = [];
  let paramIdx = 0;
  
  // Handle AND conditions
  const parts = whereStr.split(/\s+AND\s+/i);
  
  parts.forEach(part => {
    part = part.trim();
    if (part.includes('>=')) {
      const [col, _] = part.split('>=').map(s => s.trim());
      const val = params[paramIdx++];
      conditions.push(r => r[col] >= val);
    } else if (part.includes('<=')) {
      const [col, _] = part.split('<=').map(s => s.trim());
      const val = params[paramIdx++];
      conditions.push(r => r[col] <= val);
    } else if (part.includes('!=')) {
      const [col, _] = part.split('!=').map(s => s.trim());
      const val = params[paramIdx++];
      conditions.push(r => r[col] != val);
    } else if (part.includes('=')) {
      const eqIdx = part.indexOf('=');
      const col = part.slice(0, eqIdx).trim().replace(/^\w+\./, '');
      const valPart = part.slice(eqIdx + 1).trim();
      if (valPart === '?') {
        const val = params[paramIdx++];
        conditions.push(r => String(r[col]) === String(val));
      } else {
        // literal value
        const val = valPart.replace(/'/g, '');
        conditions.push(r => String(r[col]) === String(val));
      }
    }
  });
  
  return (record) => conditions.every(c => c(record));
}

function exec(sql) {
  // For CREATE TABLE etc — just ignore in lowdb
  return [];
}

function pragma() { return null; }

console.log('✅ LowDB database initialized');

module.exports = { prepare, exec, pragma, db };
