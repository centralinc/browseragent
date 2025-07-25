# Agent Signals: Pause, Resume, Cancel for `ComputerUseAgent`

## 1  Purpose
Provide **first-class control-flow capabilities** for long-running agent executions so that external code (UI, CLI, orchestration service) can _pause_, _resume_ or _cancel_ a workflow and be notified when these state changes occur.

## 2  Motivation
1. **Human-in-the-loop oversight** – Operators can halt automation, fix page state manually, then continue from the same step.
2. **Debugging** – Developers can stop at an interesting point, inspect the DOM, tweak prompts, then resume.
3. **Error recovery & timeouts** – Supervisors can cancel a stuck agent gracefully instead of killing the process.

## 3  Glossary
| Term                | Meaning |
|---------------------|---------|
| **Control Signal**  | Command _sent_ **to** the agent loop: `pause`, `resume`, `cancel`. |
| **Signal Event**    | Notification _emitted by_ the agent loop: `onPause`, `onResume`, `onCancel`, `onError`. |
| **Agent Controller**| Object returned by `agent.execute()` exposing `signal()` and `on()`. |
| **Signal Bus**      | Internal lightweight event-emitter delivering events to listeners. |
| **Step Index**      | 0-based counter of the next `tool_use`/LLM turn; included in payloads for debugging. |

## 4  Design Goals
* **No breaking changes** – Existing consumers can ignore the new API.
* **Non-blocking** – Pausing waits until the _current_ tool_use completes; we never abruptly kill a running Playwright/computer call.
* **Tool-agnostic** – Works with any current/future tools because signals act at the loop level.
* **Composable** – Same plumbing can later power step/breakpoints, state persistence, or multi-agent coordination.

## 5  Public API (changes inside our repo)

> **Key files:** `agent.ts`, new `signals/bus.ts`, updates to `loop.ts`/`computerUseLoop`

### 5.1  Types & primitives (unchanged)
```ts
export type ControlSignal = 'pause' | 'resume' | 'cancel';
export type SignalEvent  = 'onPause' | 'onResume' | 'onCancel' | 'onError';
```
`SignalBus` + `AgentController` definitions remain the same as earlier.

### 5.2  `ComputerUseAgent` surface
```diff
 export class ComputerUseAgent {
   private apiKey: string;
   private model: string;
   private page: Page;
+  /** Expose control-flow signals */
+  public readonly controller: AgentController;
-  // (old design stored controller lazily)
 
   constructor({ apiKey, page, model = DEFAULT_MODEL }: { … }) {
     this.apiKey = apiKey;
     this.model  = model;
     this.page   = page;
-
-    // old flow: controller created after first execute()
-    this.controller = undefined as any;
+
+    // NEW: create the signal bus + controller up-front so callers can pause *during* first run
+    const bus          = new SignalBus();
+    this.controller    = new AgentControllerImpl(bus);
+    this.signalBus     = bus;          // private helper
   }
 
-  async execute<T = string>(…): Promise<{ result: T; controller: AgentController }> {
+  async execute<T = string>(…): Promise<T> {
       …
-    const { messages, controller } = await computerUseLoop({
+    const messages = await computerUseLoop({
         …,
-        signalBus: this.signalBus,
+        signalBus: this.signalBus,
       });
 
-    // controller already exists – no need to return it
+    // parse & return
    return parsedResult as T;
  }
 }
```
*No breaking change:* `execute()` still returns `T` just like today; developers access `agent.controller` for signalling.

## 6  Loop integration changes
`computerUseLoop` signature now accepts an existing `signalBus`:
```ts
export async function computerUseLoop({ …, signalBus }: { …; signalBus: SignalBus }): Promise<BetaMessageParam[]> { … }
```
Inside the loop we honour pause/cancel states exactly as in section 4.

## 7  Example using public API
```ts
const agent = new ComputerUseAgent({ apiKey, page });

// wire events BEFORE kicking off the job
agent.controller.on('onPause', () => console.log('paused…'));
agent.controller.on('onError', ({ error }) => console.error(error));

// start long-running task
const stories = await agent.execute('List the top 20 stories');

// meanwhile, somewhere else in code you could
setTimeout(() => agent.controller.signal('pause'), 5_000);
```

## 8  Migration notes
No mandatory changes for existing code; the new `controller` is additive. You may opt-in to control-flow features by reading `agent.controller`.

## 9  Repo TODOs
- [ ] implement `signals/bus.ts`
- [ ] modify `agent.ts` & loops as diffed
- [ ] add unit tests + update examples
- [ ] docs & README updates
- [ ] semantic-version bump (minor) 