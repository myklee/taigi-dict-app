import { supabase } from "./supabase.js";

export async function fixZhuyinColumn() {
  let start = 0;
  const batchSize = 1000; // Adjust as needed

  while (true) {
    const { data: words, error } = await supabase
      .from("words")
      .select("id, zhuyin")
      .range(start, start + batchSize - 1);

    if (error) {
      console.error("Error fetching words:", error);
      break;
    }
    if (!words.length) break; // Stop when no more data

    for (const word of words) {
      let updatedZhuyin = word.zhuyin;

      // Only process if it starts with a bracket, indicating an array-like string
      if (word.zhuyin && word.zhuyin.startsWith("[")) {
        try {
          const zhuyinArray = JSON.parse(word.zhuyin); // Parse string to array

          // If it's a valid array, join the elements to form a string
          if (Array.isArray(zhuyinArray)) {
            updatedZhuyin = zhuyinArray.join(" "); // Join elements with space
            const { error: updateError } = await supabase
              .from("words")
              .update({ zhuyin: updatedZhuyin })
              .eq("id", word.id);
            if (updateError) {
              console.error(`Error updating word ID ${word.id}:`, updateError);
            } else {
              console.log(`Updated word ID zhuyin string ${word.id}`);
            }
          }
          // Update the word record with the flattened Zhuyin
        } catch (error) {
          console.error(`Error parsing Zhuyin for word ID ${word.id}:`, error);
        }
      }
    }

    start += batchSize;
  }
}

// fixZhuyinColumn();
