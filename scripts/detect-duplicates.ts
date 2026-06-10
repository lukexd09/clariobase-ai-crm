import { prisma } from "../src/lib/prisma";
import { scanDuplicateCandidates } from "../src/lib/duplicates";

async function main() {
  const summary = await scanDuplicateCandidates();

  console.log(`checked pairs: ${summary.checkedPairs}`);
  console.log(`created candidates: ${summary.createdCandidates}`);
  console.log(`existing candidates skipped: ${summary.existingCandidatesSkipped}`);
  console.log(`open candidates count: ${summary.openCandidatesCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
