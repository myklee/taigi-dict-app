import { readFile } from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';

// Paths
const inputFilePath = './cedict_ts.u8';
const outputFilePath = './cedict.csv';

// Parse CC-CEDICT file
async function parseCCEDICT(filePath) {
  const entries = [];
  const fileContent = await readFile(filePath, 'utf-8');
  const lines = fileContent.split('\n');

  for (const line of lines) {
    if (line.startsWith('#')) continue; // Skip comments

    const match = line.match(/^(.+?) (.+?) \[(.+?)\] \/(.+)\//);
    if (match) {
      const [, traditional, simplified, pinyin, english] = match;
      entries.push({ traditional, simplified, pinyin, english });
    }
  }

  return entries;
}

// Write entries to CSV
async function writeToCsv(filePath, entries) {
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'traditional', title: 'Traditional' },
      { id: 'simplified', title: 'Simplified' },
      { id: 'pinyin', title: 'Pinyin' },
      { id: 'english', title: 'English' },
    ],
  });

  try {
    await csvWriter.writeRecords(entries);
    console.log(`CSV file created at: ${filePath}`);
  } catch (error) {
    console.error('Error writing CSV:', error);
  }
}

// Main function
async function main() {
  try {
    const entries = await parseCCEDICT(inputFilePath);
    await writeToCsv(outputFilePath, entries);
  } catch (error) {
    console.error('Error processing:', error);
  }
}

// Execute
main();
