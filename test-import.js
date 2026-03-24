try {
  import('./server/scripts/extract-training-data.ts').then(console.log).catch(err => console.error("IMPORT ERROR:", err));
} catch(e) {
  console.error("SYNC ERROR:", e);
}
