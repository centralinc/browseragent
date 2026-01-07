export class KeyboardUtils {
  private static readonly modifierKeyMap: Record<string, string> = {
    ctrl: "Control",
    alt: "Alt",
    shift: "Shift",
    command: "Meta",
    win: "Meta",
  };

  private static readonly keyMap: Record<string, string> = {
    return: "Enter",
    space: " ",
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pagedown: "PageDown",
    delete: "Delete",
    backspace: "Backspace",
    tab: "Tab",
    esc: "Escape",
    escape: "Escape",
    insert: "Insert",
    super_l: "Meta",
    f1: "F1",
    f2: "F2",
    f3: "F3",
    f4: "F4",
    f5: "F5",
    f6: "F6",
    f7: "F7",
    f8: "F8",
    f9: "F9",
    f10: "F10",
    f11: "F11",
    f12: "F12",
    // Symbolic keys
    minus: "-",
    plus: "+",
    equal: "=",
    equals: "=",
    period: ".",
    dot: ".",
    comma: ",",
    slash: "/",
    backslash: "\\",
    bracketleft: "[",
    bracketright: "]",
    semicolon: ";",
    quote: "'",
    backquote: "`",
    tilde: "~",
  };

  static isModifierKey(key: string | undefined): boolean {
    if (!key) return false;
    const normalizedKey = this.modifierKeyMap[key.toLowerCase()] || key;
    return ["Control", "Alt", "Shift", "Meta"].includes(normalizedKey);
  }

  static getPlaywrightKey(key: string | undefined): string {
    if (!key) {
      throw new Error("Key cannot be undefined");
    }

    const normalizedKey = key.toLowerCase();

    if (normalizedKey in this.keyMap) {
      return this.keyMap[normalizedKey] as string;
    }

    if (normalizedKey in this.modifierKeyMap) {
      return this.modifierKeyMap[normalizedKey] as string;
    }

    return key;
  }

  static parseKeySequence(sequence: string): string[] {
    if (!sequence) {
      throw new Error("Key sequence cannot be empty");
    }

    const keys: string[] = [];
    const parts = sequence.trim().split(/\s+/);

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      const repeatMatch = trimmedPart.match(/^(.+?)\*(\d+)$/);
      if (repeatMatch && repeatMatch[1] && repeatMatch[2]) {
        const key = repeatMatch[1];
        const count = parseInt(repeatMatch[2], 10);
        if (count < 1 || count > 100) {
          throw new Error(
            `Invalid repetition count ${count}. Must be between 1 and 100`,
          );
        }
        for (let i = 0; i < count; i++) {
          keys.push(this.getPlaywrightKey(key));
        }
      } else {
        keys.push(this.getPlaywrightKey(trimmedPart));
      }
    }

    if (keys.length === 0) {
      throw new Error("Key sequence resulted in no valid keys");
    }

    return keys;
  }

  static parseKeyCombination(combo: string): string[] {
    if (!combo) {
      throw new Error("Key combination cannot be empty");
    }
    return combo
      .toLowerCase()
      .split("+")
      .map((key) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          throw new Error("Invalid key combination: empty key");
        }
        return this.getPlaywrightKey(trimmedKey);
      });
  }
}
