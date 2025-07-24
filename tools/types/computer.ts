export enum Action {
  // Mouse actions
  MOUSE_MOVE = 'mouse_move',
  LEFT_CLICK = 'left_click',
  RIGHT_CLICK = 'right_click',
  MIDDLE_CLICK = 'middle_click',
  DOUBLE_CLICK = 'double_click',
  TRIPLE_CLICK = 'triple_click',
  LEFT_CLICK_DRAG = 'left_click_drag',
  LEFT_MOUSE_DOWN = 'left_mouse_down',
  LEFT_MOUSE_UP = 'left_mouse_up',

  // Keyboard actions
  KEY = 'key',
  TYPE = 'type',
  HOLD_KEY = 'hold_key',

  // System actions
  SCREENSHOT = 'screenshot',
  CURSOR_POSITION = 'cursor_position',
  SCROLL = 'scroll',
  WAIT = 'wait',
  EXTRACT_URL = 'extract_url',
}

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
export type Coordinate = [number, number];
export type Duration = number;

export interface ActionParams {
  action: Action;
  text?: string;
  coordinate?: Coordinate;
  scrollDirection?: ScrollDirection;
  scrollAmount?: number;
  scroll_amount?: number;
  duration?: Duration;
  // Allow additional properties for compatibility
  [key: string]: Action | string | Coordinate | ScrollDirection | number | Duration | undefined;
}

export interface BaseAnthropicTool {
  name: string;
  apiType: string;
  toParams(): Record<string, unknown>;
} 