import { syncKnowledgeBaseFromDrive } from "../services/rag-ingestion";

console.log("Starting manual synchronization of the Allio Neural Brain...");
syncKnowledgeBaseFromDrive().then((result) => {
  console.log("Synchronization complete.", result);
  process.exit(0);
}).catch((err) => {
  console.error("Failed to sync:", err);
  process.exit(1);
});
