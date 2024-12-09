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
import fromPinyin from "zhuyin";
import { supabase } from "./supabase.js";

export async function updateZhuyinInBatches(batchSize = 1000) {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch a batch of rows
    const { data: words, error } = await supabase
      .from("words")
      .select("id, pinyin, zhuyin")
      .is("zhuyin", null) // Only rows without Zhuyin
      .not("pinyin", "is", null) // Rows that have Pinyin
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
      const zhuyinText = fromPinyin(word.pinyin).join(' ');

      // Update the word record with Pinyin
      const { error: updateError } = await supabase
        .from("words")
        .update({ zhuyin: zhuyinText })
        .eq("id", word.id);
      // console.log(word.zhuyin);
      // console.log(word.zhuyin, typeof word.zhuyin, Array.isArray(word.zhuyin));

      // if (Array.isArray(word.zhuyin)) {
      //   // Join array into a single string
      //   const joinedZhuyin = word.zhuyin.join(" ");

      //   // Update the `zhuyin` column with the joined string
      //   const { error: updateError } = await supabase
      //     .from("words")
      //     .update({ zhuyin: joinedZhuyin })
      //     .eq("id", word.id);

      //   if (updateError) {
      //     console.error(`Error updating word ID ${word.id}:`, updateError);
      //   } else {
      //     console.log(`Updated zhuyin for word ID ${word.id}`);
      //   }
      // }
      if (updateError) {
        console.error(`Error updating word ID ${word.id}:`, updateError);
      } else {
        console.log(
          `Updated Zhuyin for word ID ${word.id} ${word.pinyin} ${zhuyinText}`
        );
      }
    }

    // Move to the next batch
    offset += batchSize;
  }

  console.log("Zhuyin update completed.");
}
updateZhuyinInBatches();
