import { bookName } from "./bookName";

function assert(isTrue, success, failure = "Failed") {
    if(isTrue) {
        console.log("✅ " + success);
    } else {
        console.log("❌ " + failure + " (" + success + ")");
    }
    return isTrue;
}

assert(
    bookName([1, 2, 3]) === "Chapters 1 - 3",
    "Basic chapter shortening"
);

assert(
    bookName([1, 2, 3, 4, 5], [{ vol: 1, chapters: 5}]) === "Vol 1",
    "Basic shortening to volumes"
);

assert(
    bookName([1,2,3,4,5], [{vol: 1, chapters: 3}]) === "Vol 1, Chapters 4, 5",
    "Mixed volume and chapter shortening"
);

assert(
    bookName([1, 2], [{vol: 1, chapters: 3}, {vol: 2, chapters: 5}]) === "Chapters 1, 2",
    "List of chapters without shortening with volume definitions"
);

assert(
    bookName([1,2,3,5,6]) === "Chapters 1 - 3, 5, 6",
    "Mixed shortening and list of chapters"
);

assert(
    bookName([1,2,3,4,5], [{vol: "First", chapters: 5}]) === "Vol First",
    "String volume"
);

assert(
    bookName([1,2,3.5,3]) === "Chapters 1 - 3, 3.5",
    "Float chapters"
);

assert(
    bookName([1,2,"3.5.1", 3]) === "Chapters 1 - 3, 3.5.1",
    "String chapters"
);

assert(
    bookName([1,3,5,2,4]) === "Chapters 1 - 5",
    "Out of order input"
);

assert(
    bookName([1,2,3,4,5,"5.1"], [{ vol: 1, chapters: 5 }]) === "Vol 1, Chapters 5.1",
    "String/float chapters and volume definitions"
)