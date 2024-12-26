// import pinyin from "pinyin"; // For Pinyin and Bopomofo
// // import { Segment } from 'segmentit';

// import { supabase } from "./supabase.js"; // Your Supabase import

// export async function updatePinyinBopomofo() {
//   // Get all words with their Chinese characters
//   const { data: words, error } = await supabase
//     .from("words")
//     .select("id, chinese");
//   // wordsp = words;
//   if (error) {
//     console.error("Error fetching words:", error);
//     return;
//   }

//   // Iterate over each word, generate Pinyin and Bopomofo
//   for (const word of words) {
//     const pinyinText = pinyin(word.chinese, { style: pinyin.STYLE_TONE2 }).join(
//       " "
//     );

//     // Update the word record with Pinyin and Bopomofo
//     const { error: updateError } = await supabase
//       .from('words')
//       .update({ pinyin: pinyinText })
//       .eq('id', word.id);

//     if (updateError) {
//       console.error('Error updating word:', updateError);
//     } else {
//       console.log(`Updated Pinyin and Bopomofo for word ID ${word.id}`);
//     }
//   }
//   // console.log(wordsp);
// }

// // updatePinyinBopomofo();
import pinyin from "pinyin";
import { supabase } from "./supabase.js";

export async function updatePinyinInBatches(batchSize = 1000) {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of rows
    const { data: words, error } = await supabase
      .from("words")
      .select("id, chinese, pinyin")
      .is("pinyin", null) // Only rows without Zhuyin
      .not ("chinese", "is", null)
      .range(offset, offset + batchSize - 1); // Paginate with offset and batch size

    if (error) {
      console.error("Error fetching words:", error);
      return;
    }

    if (words.length === 0) {
      hasMore = false; // No more rows to process
      break;
    }

    // Iterate through each word in the batch
    for (const word of words) {
      const pinyinText = pinyin(word.chinese, { style: pinyin.STYLE_TONE2 })
        .map((item) => item[0]) // Use the first Pinyin for each character
        .join(" "); // Join with spaces

      // Update the word record with Pinyin
      const { error: updateError } = await supabase
        .from("words")
        .update({ pinyin: pinyinText })
        .eq("id", word.id);

      if (updateError) {
        console.error(`Error updating word ID ${word.id}:`, updateError);
      } else {
        console.log(`Updated Pinyin for word ID ${word.id}`);
      }
    }

    // Move to the next batch
    offset += batchSize;
  }

  console.log("Pinyin update completed.");
}
// updatePinyinInBatches();
