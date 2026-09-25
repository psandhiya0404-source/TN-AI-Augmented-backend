const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'db.json');

const initialData = {
  users: [],
  refresh_tokens: [],
  documents: [],
  quizzes: [],
  flashcards: [],
  study_plans: []
};

class Database {
  constructor() {
    this.ensureDirectoryAndFile();
    this.data = this.load();
  }

  ensureDirectoryAndFile() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbFilePath)) {
      fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  load() {
    try {
      const content = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading db file, reinitializing:', err.message);
      return { ...initialData };
    }
  }

  save() {
    try {
      fs.writeFileSync(dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db file:', err.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
      this.save();
    }
    return this.data[name];
  }

  insert(collectionName, item) {
    const collection = this.getCollection(collectionName);
    const newItem = {
      id: item.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    collection.push(newItem);
    this.save();
    return newItem;
  }

  find(collectionName, filterFn = () => true) {
    const collection = this.getCollection(collectionName);
    return collection.filter(filterFn);
  }

  findOne(collectionName, filterFn) {
    const collection = this.getCollection(collectionName);
    return collection.find(filterFn) || null;
  }

  findById(collectionName, id) {
    const collection = this.getCollection(collectionName);
    return collection.find(item => item.id === id) || null;
  }

  update(collectionName, id, updates) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;

    collection[index] = {
      ...collection[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return collection[index];
  }

  delete(collectionName, id) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;

    collection.splice(index, 1);
    this.save();
    return true;
  }

  deleteWhere(collectionName, filterFn) {
    const collection = this.getCollection(collectionName);
    const initialCount = collection.length;
    this.data[collectionName] = collection.filter(item => !filterFn(item));
    this.save();
    return initialCount - this.data[collectionName].length;
  }
}

const db = new Database();
module.exports = db;
