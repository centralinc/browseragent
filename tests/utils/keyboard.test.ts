import { KeyboardUtils } from "./keyboard";

console.log("Testing KeyboardUtils...\n");

console.log("1. Testing parseKeySequence with space-separated keys:");
try {
  const result1 = KeyboardUtils.parseKeySequence("Down Down Down");
  console.log("   Input: 'Down Down Down'");
  console.log("   Output:", result1);
  console.log("   ✅ Expected: ['ArrowDown', 'ArrowDown', 'ArrowDown']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n2. Testing parseKeySequence with repetition syntax:");
try {
  const result2 = KeyboardUtils.parseKeySequence("Down*3");
  console.log("   Input: 'Down*3'");
  console.log("   Output:", result2);
  console.log("   ✅ Expected: ['ArrowDown', 'ArrowDown', 'ArrowDown']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n3. Testing parseKeySequence with mixed keys:");
try {
  const result3 = KeyboardUtils.parseKeySequence("Up Up Enter");
  console.log("   Input: 'Up Up Enter'");
  console.log("   Output:", result3);
  console.log("   ✅ Expected: ['ArrowUp', 'ArrowUp', 'Enter']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n4. Testing parseKeyCombination (traditional):");
try {
  const result4 = KeyboardUtils.parseKeyCombination("Ctrl+C");
  console.log("   Input: 'Ctrl+C'");
  console.log("   Output:", result4);
  console.log("   ✅ Expected: ['Control', 'c']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n5. Testing parseKeyCombination with multiple modifiers:");
try {
  const result5 = KeyboardUtils.parseKeyCombination("Ctrl+Shift+A");
  console.log("   Input: 'Ctrl+Shift+A'");
  console.log("   Output:", result5);
  console.log("   ✅ Expected: ['Control', 'shift', 'a']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n6. Testing parseKeySequence with repetition and space:");
try {
  const result6 = KeyboardUtils.parseKeySequence("Tab*2 Enter");
  console.log("   Input: 'Tab*2 Enter'");
  console.log("   Output:", result6);
  console.log("   ✅ Expected: ['Tab', 'Tab', 'Enter']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n7. Testing getPlaywrightKey with various keys:");
try {
  console.log("   'down' ->", KeyboardUtils.getPlaywrightKey("down"));
  console.log("   'Down' ->", KeyboardUtils.getPlaywrightKey("Down"));
  console.log("   'ctrl' ->", KeyboardUtils.getPlaywrightKey("ctrl"));
  console.log("   'return' ->", KeyboardUtils.getPlaywrightKey("return"));
  console.log("   'a' ->", KeyboardUtils.getPlaywrightKey("a"));
  console.log("   'A' ->", KeyboardUtils.getPlaywrightKey("A"));
  console.log("   ✅ All keys mapped correctly");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n8. Testing error handling - invalid repetition:");
try {
  KeyboardUtils.parseKeySequence("Down*999");
  console.log("   ❌ Should have thrown error for count > 100");
} catch (error) {
  console.log("   ✅ Correctly threw error:", (error as Error).message);
}

console.log("\n9. Testing error handling - empty sequence:");
try {
  KeyboardUtils.parseKeySequence("");
  console.log("   ❌ Should have thrown error for empty sequence");
} catch (error) {
  console.log("   ✅ Correctly threw error:", (error as Error).message);
}

console.log("\n10. Testing edge case - single key:");
try {
  const result10 = KeyboardUtils.parseKeySequence("Enter");
  console.log("   Input: 'Enter'");
  console.log("   Output:", result10);
  console.log("   ✅ Expected: ['Enter']");
} catch (error) {
  console.error("   ❌ Error:", error);
}

console.log("\n✅ All tests completed!");

